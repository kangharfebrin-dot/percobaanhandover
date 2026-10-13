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

// 1. GET Notifications (B3: User-targeted & role-based)
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
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1b. GET Unread Notifications Count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const targetRoles = getTargetRolesForUser(role);

    const count = await prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: targetRoles },
            targetUserId: null
          }
        ]
      }
    });

    res.json({ success: true, count });
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
    const targetRoles = getTargetRolesForUser(role);

    const isTargetUser = notification.targetUserId === userId;
    const isTargetRole = !notification.targetUserId && targetRoles.includes(notification.targetRole);

    if (!isTargetUser && !isTargetRole) {
      return res.status(403).json({ error: 'Tidak ada akses untuk notifikasi ini' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
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
    const targetRoles = getTargetRolesForUser(role);

    await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { targetUserId: userId },
          {
            targetRole: { in: targetRoles },
            targetUserId: null
          }
        ]
      },
      data: { isRead: true }
    });

    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
