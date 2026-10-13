const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole, normalizeRole } = require('../middleware/auth');
const { userManageSchema } = require('../validators/schemas');

// 1. GET Workers (Pekerja AMT)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const isAmt = actorRole === 'AMT';

    const workers = await prisma.user.findMany({
      where: {
        role: { in: ['AMT', 'USER'] },
        deletedAt: null
      },
      select: isAmt
        ? { id: true, name: true, jabatan: true }
        : {
            id: true,
            name: true,
            username: true,
            role: true,
            jabatan: true,
            createdAt: true
          },
      orderBy: { name: 'asc' }
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Worker (Tambah Pekerja - Admin hanya boleh membuat AMT, Super Admin bebas)
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const { error, value } = userManageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, username, password, role, jabatan } = value;

    // Batasan ADMIN: hanya boleh membuat akun AMT
    if (actorRole === 'ADMIN') {
      if (role && normalizeRole(role) !== 'AMT') {
        return res.status(403).json({
          error: `Akses ditolak: Admin tidak diizinkan membuat akun dengan peran '${role}'. Admin hanya dapat mengelola akun AMT.`
        });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { username, deletedAt: null }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Hash password menggunakan bcrypt
    const rawPassword = password && password.trim() !== '' ? password : username;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const targetRole = actorRole === 'ADMIN' ? 'AMT' : (role ? normalizeRole(role) : 'AMT');

    const newWorker = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: targetRole,
        jabatan: jabatan || null
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

    // Catat ke AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATE_AMT',
        actionType: 'USER_MANAGEMENT',
        actionId: newWorker.id,
        details: JSON.stringify({ actorRole, targetUsername: username, targetRole })
      }
    }).catch(() => {});

    res.status(201).json({ success: true, worker: newWorker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Worker (Ubah Data Pekerja - Admin hanya boleh mengubah akun AMT & tidak boleh promosi)
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const targetId = req.params.id;

    const existingWorker = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existingWorker) {
      return res.status(404).json({ error: 'Data pekerja tidak ditemukan' });
    }

    const existingEffectiveRole = normalizeRole(existingWorker.role);

    // Batasan ADMIN: hanya boleh memodifikasi akun AMT
    if (actorRole === 'ADMIN') {
      if (existingEffectiveRole !== 'AMT') {
        return res.status(403).json({
          error: `Akses ditolak: Admin tidak diizinkan memodifikasi akun dengan peran '${existingWorker.role}'. Admin hanya dapat mengelola akun AMT.`
        });
      }

      // Admin dilarang menaikkan hak akses AMT menjadi PENGAWAS, ADMIN, atau SUPER_ADMIN
      if (req.body.role && normalizeRole(req.body.role) !== 'AMT') {
        return res.status(403).json({
          error: `Akses ditolak: Admin tidak diizinkan menaikkan peran akun menjadi '${req.body.role}'.`
        });
      }
    }

    // Proteksi integritas SUPER_ADMIN: jangan demote Super Admin terakhir
    if (actorRole === 'SUPER_ADMIN' && existingWorker.role === 'SUPER_ADMIN') {
      if (req.body.role && normalizeRole(req.body.role) !== 'SUPER_ADMIN') {
        const activeSuperAdmins = await prisma.user.count({
          where: { role: 'SUPER_ADMIN', deletedAt: null }
        });
        if (activeSuperAdmins <= 1) {
          return res.status(400).json({
            error: 'Tidak dapat mengubah role Super Admin terakhir. Sistem memerlukan minimal 1 Super Admin aktif.'
          });
        }
      }
    }

    const { name, username, role, password, jabatan } = req.body;

    // Jika username diubah, pastikan tidak duplikat dengan akun lain
    if (username && username !== existingWorker.username) {
      const duplicate = await prisma.user.findFirst({
        where: { username, id: { not: targetId }, deletedAt: null }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Username baru sudah digunakan oleh akun lain' });
      }
    }

    const updateData = {
      name: name || existingWorker.name,
      username: username || existingWorker.username,
      role: actorRole === 'ADMIN' ? 'AMT' : (role ? normalizeRole(role) : existingWorker.role),
      jabatan: jabatan !== undefined ? jabatan : existingWorker.jabatan
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedWorker = await prisma.user.update({
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
        action: 'USER_UPDATE_AMT',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: updatedWorker.username, newRole: updatedWorker.role })
      }
    }).catch(() => {});

    res.json({ success: true, worker: updatedWorker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE Worker (Hapus Pekerja - Admin hanya boleh menghapus akun AMT)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const targetId = req.params.id;

    if (req.user && req.user.id === targetId) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' });
    }

    const existing = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Data pekerja tidak ditemukan' });
    }

    const existingEffectiveRole = normalizeRole(existing.role);

    // Batasan ADMIN: hanya boleh menghapus akun AMT
    if (actorRole === 'ADMIN') {
      if (existingEffectiveRole !== 'AMT') {
        return res.status(403).json({
          error: `Akses ditolak: Admin tidak diizinkan menghapus akun dengan peran '${existing.role}'. Admin hanya dapat mengelola akun AMT.`
        });
      }
    }

    // Proteksi integritas SUPER_ADMIN: jangan hapus Super Admin terakhir
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
        action: 'USER_DELETE_AMT',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: existing.username, targetRole: existing.role })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Pekerja berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
