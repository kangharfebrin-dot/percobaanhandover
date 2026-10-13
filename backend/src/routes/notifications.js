const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, normalizeRole } = require('../middleware/auth');

/**
 * Helper: Daftar targetRole yang sesuai untuk user berdasarkan effective role.
 * Backward compatible: AMT menerima notifikasi dengan targetRole 'AMT' maupun 'USER'.
 */
const getTargetRolesForUser = (rawRole) => {
  const effective = normalizeRole(rawRole);
  if (effective === 'AMT') {
    return ['USER', 'AMT', 'ALL'];
  } else if (effective === 'PENGAWAS') {
    return ['PENGAWAS', 'ALL'];
  } else if (effective === 'SUPER_ADMIN') {
    return ['SUPER_ADMIN', 'ADMIN', 'ALL'];
  } else {
    // ADMIN
    return ['ADMIN', 'ALL'];
  }
};

// 1. GET Notifications (B3: User-targeted & role-based, per-user isRead status)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    const targetRoles = getTargetRolesForUser(role);

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: targetRoles },
            targetUserId: null
          }
        ]
      },
      include: {
        reads: {
          where: { userId },
          select: { id: true, readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const mapped = notifications.map(n => {
      const isUserRead = (n.reads && n.reads.length > 0) || (n.targetUserId === userId && n.isRead);
      const { reads, ...rest } = n;
      return {
        ...rest,
        isRead: Boolean(isUserRead)
      };
    });

    res.json({ success: true, notifications: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1b. GET Unread Notifications Count (per-user)
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const targetRoles = getTargetRolesForUser(role);

    const count = await prisma.notification.count({
      where: {
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: targetRoles },
            targetUserId: null
          }
        ],
        reads: {
          none: { userId }
        },
        NOT: {
          targetUserId: userId,
          isRead: true
        }
      }
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. PUT Mark Single Notification as Read (per-user via NotificationRead)
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });

    const role = req.user.role;
    const userId = req.user.id;
    const targetRoles = getTargetRolesForUser(role);

    const isTargetUser = notification.targetUserId === userId;
    const isTargetRole = !notification.targetUserId && targetRoles.includes(notification.targetRole);

    if (!isTargetUser && !isTargetRole) {
      return res.status(403).json({ error: 'Tidak ada akses untuk notifikasi ini' });
    }

    // Catat status baca spesifik per-user
    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: id,
          userId: userId
        }
      },
      create: {
        notificationId: id,
        userId: userId
      },
      update: {
        readAt: new Date()
      }
    });

    // Jika notifikasi langsung ke user (bukan broadcast ke role), update juga flag isRead
    if (isTargetUser) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
    }

    res.json({
      success: true,
      notification: {
        ...notification,
        isRead: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Mark All Notifications as Read for current user (per-user)
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const targetRoles = getTargetRolesForUser(role);

    // Ambil semua notifikasi yang belum dibaca oleh user ini
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: targetRoles },
            targetUserId: null
          }
        ],
        reads: {
          none: { userId }
        },
        NOT: {
          targetUserId: userId,
          isRead: true
        }
      },
      select: { id: true, targetUserId: true }
    });

    if (unreadNotifications.length > 0) {
      const readData = unreadNotifications.map(n => ({
        notificationId: n.id,
        userId: userId
      }));

      await prisma.notificationRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      // Tandai isRead: true untuk notifikasi yang ditargetkan langsung ke user ini
      const directIds = unreadNotifications.filter(n => n.targetUserId === userId).map(n => n.id);
      if (directIds.length > 0) {
        await prisma.notification.updateMany({
          where: { id: { in: directIds } },
          data: { isRead: true }
        });
      }
    }

    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
