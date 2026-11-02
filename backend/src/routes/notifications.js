const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');

// 1. GET Notifications (User-targeted & role-based scoping)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 250;
    const { date, noPolisi, search } = req.query;

    const conditions = [];

    // Role-based scoping:
    // - ADMIN & SUPER_ADMIN: Bebas melihat semua notifikasi di sistem ("admin mah bebas bisa lihat semua")
    // - PENGAWAS: Melihat notifikasi pengawasan operasional armada (targetRole PENGAWAS/ALL) dan notifikasi miliknya
    // - AMT / USER: STRICTLY PRIVATE! Hanya notifikasi yang secara eksplisit ditujukan ke akun AMT ini ("fokus ke akun amt itu ... jadi kek privet")
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Tidak dibatasi, melihat seluruh notifikasi
    } else if (role === 'PENGAWAS') {
      conditions.push({
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: ['PENGAWAS', 'ALL'] },
            targetUserId: null
          }
        ]
      });
    } else {
      // AMT / USER: Hanya notifikasi yang secara spesifik ditujukan ke akun ini
      conditions.push({
        targetUserId: userId
      });
    }

    if (noPolisi) {
      conditions.push({
        noPolisi: { contains: noPolisi.replace(/\s+/g, '') }
      });
    }

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      conditions.push({
        createdAt: { gte: start, lte: end }
      });
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { message: { contains: search } },
          { noPolisi: { contains: search.replace(/\s+/g, '') } }
        ]
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Deduplikasi pesan kembar:
    // Jika sebuah event (actionId) memiliki variasi pesan untuk role berbeda
    // (misal judul untuk Admin/Pengawas vs judul privat untuk AMT):
    // 1. Notifikasi yang sesuai dengan role pengguna yang sedang login diprioritaskan
    // 2. Hilangkan duplikat untuk event yang sama agar tidak muncul double-double di notifikasi
    const seenActionMap = new Map();
    const uniqueNotifications = [];

    // Urutkan prioritas: notifikasi yang sesuai targetRole user diutamakan
    const sortedNotifications = [...notifications].sort((a, b) => {
      const aIsDirect = (a.targetRole === role) || (role === 'SUPER_ADMIN' && a.targetRole === 'ADMIN') || (a.targetUserId === userId);
      const bIsDirect = (b.targetRole === role) || (role === 'SUPER_ADMIN' && b.targetRole === 'ADMIN') || (b.targetUserId === userId);
      if (aIsDirect && !bIsDirect) return -1;
      if (!aIsDirect && bIsDirect) return 1;
      return 0;
    });

    for (const notif of sortedNotifications) {
      // Jika memiliki actionId (notifikasi terikat transaksi/inspeksi/isu tertentu):
      // Kunci deduplikasi mengikat pada actionId + level/type (ERROR/WARNING/INFO/SUCCESS)
      const dedupKey = notif.actionId
        ? `${notif.actionId}_${notif.type || ''}`
        : `${notif.actionType || ''}_${notif.title}_${notif.message}`;

      if (!seenActionMap.has(dedupKey)) {
        seenActionMap.set(dedupKey, notif);
        uniqueNotifications.push(notif);
      }
    }

    // Kembalikan urutan sesuai waktu terbaru (createdAt desc)
    uniqueNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, notifications: uniqueNotifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. PUT Mark Single Notification as Read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });

    const role = req.user.role;
    const userId = req.user.id;

    // Admin & Super Admin bebas mengelola semua notifikasi
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      if (role === 'PENGAWAS') {
        const isTargetUser = notification.targetUserId === userId;
        const isTargetRole = !notification.targetUserId && ['PENGAWAS', 'ALL'].includes(notification.targetRole);
        if (!isTargetUser && !isTargetRole) {
          return res.status(403).json({ error: 'Tidak ada akses untuk notifikasi ini' });
        }
      } else {
        // AMT / USER: Hanya berhak menandai notifikasi yang ditujukan khusus ke dirinya
        if (notification.targetUserId !== userId) {
          return res.status(403).json({ error: 'Tidak ada akses untuk notifikasi ini' });
        }
      }
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    // Tandai juga kembaran notifikasi untuk event yang sama agar tidak tertinggal unread
    if (notification.actionId) {
      await prisma.notification.updateMany({
        where: {
          actionId: notification.actionId,
          isRead: false
        },
        data: { isRead: true }
      }).catch(() => {});
    }

    res.json({ success: true, notification: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Mark All Notifications as Read for current user
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let updateWhere;

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // Admin dapat menandai notifikasi target role ADMIN/ALL atau targetUserId miliknya
      updateWhere = {
        isRead: false,
        OR: [
          { targetRole: { in: ['ADMIN', 'SUPER_ADMIN', 'ALL'] } },
          { targetUserId: userId }
        ]
      };
    } else if (role === 'PENGAWAS') {
      updateWhere = {
        isRead: false,
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: ['PENGAWAS', 'ALL'] },
            targetUserId: null
          }
        ]
      };
    } else {
      // AMT / USER: Hanya tandai notifikasi akun pribadinya sendiri
      updateWhere = {
        isRead: false,
        targetUserId: userId
      };
    }

    await prisma.notification.updateMany({
      where: updateWhere,
      data: { isRead: true }
    });

    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
