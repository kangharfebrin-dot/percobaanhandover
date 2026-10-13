const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole, normalizeRole } = require('../middleware/auth');
const { userManageSchema } = require('../validators/schemas');

// 1. GET All Admins (Khusus Super Admin - Admin dilarang membuka manajemen akun Admin)
router.get('/', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jabatan: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// OPERATIONAL METRICS & CONTROL CENTER APIS
// ==========================================

// 1.1 GET Ringkasan Sistem (Real Database Stats untuk Admin & Super Admin)
router.get('/system-summary', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const activeUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { role: true }
    });

    const inactiveUsersCount = await prisma.user.count({
      where: { deletedAt: { not: null } }
    });

    let amtCount = 0;
    let pengawasCount = 0;
    let adminCount = 0;
    let superAdminCount = 0;

    activeUsers.forEach(u => {
      const r = normalizeRole(u.role);
      if (r === 'SUPER_ADMIN') superAdminCount++;
      else if (r === 'ADMIN') adminCount++;
      else if (r === 'PENGAWAS') pengawasCount++;
      else if (r === 'AMT') amtCount++;
    });

    const totalVehicles = await prisma.vehicle.count();
    const activeVehicles = await prisma.vehicle.count({
      where: { status: 'Active' }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const handoversToday = await prisma.handover.count({
      where: { createdAt: { gte: startOfToday } }
    });

    const totalHandovers = await prisma.handover.count();

    const activeIssues = await prisma.issue.count({
      where: { status: { in: ['ONGOING', 'REPAIR_REQUESTED'] } }
    });

    const openAmtFindings = await prisma.amtComplianceFinding.count({
      where: { status: 'OPEN' }
    });

    const totalAuditLogs = await prisma.auditLog.count();
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' }
    });

    const recentActorIds = [...new Set(recentAuditLogs.map(l => l.userId).filter(Boolean))];
    const actors = await prisma.user.findMany({
      where: { id: { in: recentActorIds } },
      select: { id: true, name: true, username: true, role: true }
    });
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a]));

    const mappedRecentLogs = recentAuditLogs.map(log => ({
      ...log,
      actor: actorMap[log.userId] || { name: 'Sistem/Tidak Diketahui', username: '-', role: '-' }
    }));

    // Daftar pengguna terbaru per role (maks 3 per role) untuk preview di Pusat Kendali Super Admin
    const [recentAmtUsers, recentPengawasUsers, recentAdminUsers, recentSuperAdminUsers] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['AMT', 'USER'] } },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, jabatan: true, createdAt: true, deletedAt: true }
      }),
      prisma.user.findMany({
        where: { role: 'PENGAWAS' },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, jabatan: true, createdAt: true, deletedAt: true }
      }),
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, jabatan: true, createdAt: true, deletedAt: true }
      }),
      prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, username: true, role: true, jabatan: true, createdAt: true, deletedAt: true }
      })
    ]);

    const formatUserPreview = (u) => ({
      ...u,
      role: normalizeRole(u.role),
      status: u.deletedAt ? 'INACTIVE' : 'ACTIVE'
    });

    res.json({
      success: true,
      data: {
        users: {
          total: activeUsers.length,
          active: activeUsers.length,
          inactive: inactiveUsersCount,
          amt: amtCount,
          pengawas: pengawasCount,
          admin: adminCount,
          superAdmin: superAdminCount
        },
        recentUsers: {
          amt: recentAmtUsers.map(formatUserPreview),
          pengawas: recentPengawasUsers.map(formatUserPreview),
          admin: recentAdminUsers.map(formatUserPreview),
          superAdmin: recentSuperAdminUsers.map(formatUserPreview)
        },
        vehicles: {
          total: totalVehicles,
          active: activeVehicles
        },
        handovers: {
          today: handoversToday,
          total: totalHandovers
        },
        issues: {
          active: activeIssues
        },
        amtCompliance: {
          open: openAmtFindings
        },
        auditLogs: {
          total: totalAuditLogs,
          recent: mappedRecentLogs
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.2 GET Audit Logs Paginated (Untuk Admin & Super Admin)
router.get('/audit-logs', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    // Validasi page & limit
    if (rawPage !== undefined && (isNaN(parseInt(rawPage)) || parseInt(rawPage) < 1)) {
      return res.status(400).json({ error: 'Parameter page harus berupa bilangan bulat positif >= 1' });
    }
    if (rawLimit !== undefined && (isNaN(parseInt(rawLimit)) || parseInt(rawLimit) < 1)) {
      return res.status(400).json({ error: 'Parameter limit harus berupa bilangan bulat positif >= 1' });
    }

    const page = Math.max(1, parseInt(rawPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const { search, actionType, role, startDate, endDate } = req.query;

    const andConditions = [];

    // 1. Validasi & Filter Rentang Tanggal
    if (startDate || endDate) {
      const dateFilter = {};
      let startObj = null;
      let endObj = null;

      if (startDate && startDate.trim() !== '') {
        const d = new Date(startDate.trim());
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Format parameter startDate tidak valid' });
        }
        d.setHours(0, 0, 0, 0);
        startObj = d;
        dateFilter.gte = startObj;
      }

      if (endDate && endDate.trim() !== '') {
        const d = new Date(endDate.trim());
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Format parameter endDate tidak valid' });
        }
        d.setHours(23, 59, 59, 999);
        endObj = d;
        dateFilter.lte = endObj;
      }

      if (startObj && endObj && startObj > endObj) {
        return res.status(400).json({ error: 'Parameter startDate tidak boleh lebih besar daripada endDate' });
      }

      andConditions.push({ createdAt: dateFilter });
    }

    // 2. Filter Kategori Aksi (actionType)
    if (actionType && actionType.trim() !== '' && actionType.trim() !== 'ALL') {
      andConditions.push({ actionType: actionType.trim() });
    }

    // 3. Filter Role Aktor
    if (role && role.trim() !== '' && role.trim() !== 'ALL') {
      const normRole = normalizeRole(role.trim());
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PENGAWAS', 'AMT'];
      if (!validRoles.includes(normRole)) {
        return res.status(400).json({
          error: `Parameter role tidak valid. Pilihan role yang didukung: ${validRoles.join(', ')}`
        });
      }

      // Ambil seluruh user ID dengan role ini (termasuk yang deletedAt != null agar riwayat log masa lalu tidak hilang)
      const roleUsers = await prisma.user.findMany({
        where: { role: normRole },
        select: { id: true }
      });
      const roleUserIds = roleUsers.map(u => u.id);

      andConditions.push({
        userId: { in: roleUserIds.length > 0 ? roleUserIds : ['__NO_MATCH_USER_ROLE__'] }
      });
    }

    // 4. Pencarian Komprehensif (Kata Kunci)
    if (search && search.trim() !== '') {
      const q = search.trim();
      if (q.length > 100) {
        return res.status(400).json({ error: 'Kata kunci pencarian maksimal 100 karakter' });
      }

      // Cari user ID yang nama atau username-nya cocok dengan kata kunci
      const matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { username: { contains: q } }
          ]
        },
        select: { id: true }
      });
      const matchedUserIds = matchedUsers.map(u => u.id);

      const searchOrList = [
        { action: { contains: q } },
        { actionType: { contains: q } },
        { noPolisi: { contains: q } },
        { actionId: { contains: q } },
        { details: { contains: q } }
      ];

      if (matchedUserIds.length > 0) {
        searchOrList.push({ userId: { in: matchedUserIds } });
      }

      andConditions.push({ OR: searchOrList });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const actorIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, username: true, role: true }
    });
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a]));

    const mappedLogs = logs.map(log => ({
      ...log,
      actor: actorMap[log.userId] || { name: 'Sistem/Tidak Diketahui', username: '-', role: '-' }
    }));

    res.json({
      success: true,
      logs: mappedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 1
      }
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data audit log' });
  }
});

// 1.3 GET Seluruh Pengguna (Semua Role & Status - Khusus Super Admin)
router.get('/all-users', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    const where = {};

    if (status === 'active') {
      where.deletedAt = null;
    } else if (status === 'inactive') {
      where.deletedAt = { not: null };
    }

    if (role && role.trim() !== '' && role !== 'ALL') {
      const normRole = normalizeRole(role.trim());
      where.role = normRole;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { username: { contains: q } },
        { jabatan: { contains: q } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          jabatan: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formattedUsers = users.map(u => ({
      ...u,
      role: normalizeRole(u.role),
      status: u.deletedAt ? 'INACTIVE' : 'ACTIVE'
    }));

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.4 PUT Aktifkan / Nonaktifkan Pengguna (Khusus Super Admin)
router.put('/all-users/:id/status', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const targetId = req.params.id;
    const { isActive } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    if (isActive === false) {
      if (req.user && req.user.id === targetId) {
        return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif' });
      }

      const targetRole = normalizeRole(existing.role);
      if (targetRole === 'SUPER_ADMIN') {
        const activeSuperAdmins = await prisma.user.count({
          where: { role: 'SUPER_ADMIN', deletedAt: null }
        });
        if (activeSuperAdmins <= 1) {
          return res.status(400).json({
            error: 'Tidak dapat menonaktifkan Super Admin terakhir. Sistem memerlukan minimal 1 Super Admin aktif.'
          });
        }
      }

      await prisma.user.update({
        where: { id: targetId },
        data: {
          deletedAt: new Date(),
          refreshToken: null
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'USER_DEACTIVATE',
          actionType: 'USER_MANAGEMENT',
          actionId: targetId,
          details: JSON.stringify({
            actorRole: 'SUPER_ADMIN',
            targetUsername: existing.username,
            targetRole: existing.role,
            status: 'INACTIVE'
          })
        }
      }).catch(() => {});

      return res.json({ success: true, message: `Akun ${existing.username} berhasil dinonaktifkan` });
    } else {
      await prisma.user.update({
        where: { id: targetId },
        data: { deletedAt: null }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'USER_REACTIVATE',
          actionType: 'USER_MANAGEMENT',
          actionId: targetId,
          details: JSON.stringify({
            actorRole: 'SUPER_ADMIN',
            targetUsername: existing.username,
            targetRole: existing.role,
            status: 'ACTIVE'
          })
        }
      }).catch(() => {});

      return res.json({ success: true, message: `Akun ${existing.username} berhasil diaktifkan kembali` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5 PUT Ubah Role Pengguna (Khusus Super Admin)
router.put('/all-users/:id/role', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const targetId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role baru harus ditentukan' });
    }

    const newRole = normalizeRole(role);
    const validRoles = ['AMT', 'PENGAWAS', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: `Role tidak valid. Pilih salah satu dari: ${validRoles.join(', ')}` });
    }

    const existing = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const currentRole = normalizeRole(existing.role);

    if (currentRole === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', deletedAt: null }
      });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({
          error: 'Tidak dapat mengubah role Super Admin terakhir. Sistem memerlukan minimal 1 Super Admin aktif.'
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jabatan: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CHANGE_ROLE',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({
          actorRole: 'SUPER_ADMIN',
          targetUsername: existing.username,
          oldRole: currentRole,
          newRole: newRole
        })
      }
    }).catch(() => {});

    res.json({ success: true, user: updated, message: `Role akun ${existing.username} berhasil diubah ke ${newRole}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Tambah Admin Baru (Khusus Super Admin - Admin dilarang)
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan membuat akun Admin atau Super Admin. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const { error, value } = userManageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, username, password, role, jabatan } = value;

    const existingUser = await prisma.user.findFirst({
      where: { username, deletedAt: null }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
    }

    // Hash password dengan bcrypt
    const rawPassword = password && password.trim() !== '' ? password : 'admin123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const targetRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    const newAdmin = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: targetRole,
        jabatan: jabatan || (targetRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator Distribusi')
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jabatan: true,
        createdAt: true
      }
    });

    // Catat ke AuditLog tanpa menyimpan kredensial sensitif
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATE_ADMIN',
        actionType: 'USER_MANAGEMENT',
        actionId: newAdmin.id,
        details: JSON.stringify({ actorRole, targetUsername: username, targetRole })
      }
    }).catch(() => {});

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Ubah Data Admin (Khusus Super Admin - Admin dilarang)
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan memodifikasi akun Admin atau Super Admin. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const { name, username, role, password, jabatan } = req.body;
    const targetId = req.params.id;

    const existingAdmin = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existingAdmin) {
      return res.status(404).json({ error: 'Data admin tidak ditemukan' });
    }

    // Proteksi integritas: Jangan ubah role Super Admin terakhir menjadi role lain
    const requestedRole = role ? normalizeRole(role) : existingAdmin.role;
    if (existingAdmin.role === 'SUPER_ADMIN' && requestedRole !== 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', deletedAt: null }
      });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({
          error: 'Tidak dapat mengubah role Super Admin terakhir. Sistem memerlukan minimal 1 Super Admin aktif.'
        });
      }
    }

    // Jika username diubah, pastikan tidak duplikat dengan akun lain
    if (username && username !== existingAdmin.username) {
      const duplicate = await prisma.user.findFirst({
        where: { username, id: { not: targetId }, deletedAt: null }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Username baru sudah digunakan oleh akun lain' });
      }
    }

    const updateData = {
      name: name || existingAdmin.name,
      username: username || existingAdmin.username,
      role: requestedRole,
      jabatan: jabatan !== undefined ? jabatan : existingAdmin.jabatan
    };

    // Update password jika diisi
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jabatan: true,
        updatedAt: true
      }
    });

    // Catat ke AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_UPDATE_ADMIN',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: updatedAdmin.username, newRole: updatedAdmin.role })
      }
    }).catch(() => {});

    res.json({ success: true, admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE Hapus Admin (Soft Delete - Khusus Super Admin - Admin dilarang)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan menghapus akun Admin atau Super Admin. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const targetId = req.params.id;

    // Proteksi 1: Tidak boleh menghapus diri sendiri yang sedang login
    if (req.user && req.user.id === targetId) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' });
    }

    const existing = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Data admin tidak ditemukan' });
    }

    // Proteksi integritas 2: Jangan izinkan penghapusan Super Admin terakhir
    if (existing.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', deletedAt: null }
      });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({
          error: 'Tidak dapat menghapus Super Admin terakhir. Sistem memerlukan minimal 1 Super Admin aktif.'
        });
      }
    }

    // Proteksi integritas 3: Pastikan setidaknya ada 1 Admin/SuperAdmin yang tetap aktif di sistem
    const activeAdminsCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, deletedAt: null }
    });
    if (activeAdminsCount <= 1) {
      return res.status(400).json({
        error: 'Tidak dapat menghapus Admin terakhir. Sistem memerlukan minimal 1 Admin aktif.'
      });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: targetId },
      data: {
        deletedAt: new Date(),
        refreshToken: null
      }
    });

    // Catat ke AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_DELETE_ADMIN',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: existing.username, targetRole: existing.role })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Admin berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
