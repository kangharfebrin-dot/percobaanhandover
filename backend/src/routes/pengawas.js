const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole, normalizeRole } = require('../middleware/auth');
const { userManageSchema } = require('../validators/schemas');

// 1. GET Pengawas List (Khusus Super Admin - Admin dilarang membuka manajemen akun Pengawas)
router.get('/', authenticateToken, authorizeRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const pengawas = await prisma.user.findMany({
      where: {
        role: 'PENGAWAS',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jabatan: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pengawas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Pengawas (Tambah Pengawas - Khusus Super Admin, Admin dilarang)
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan membuat akun Pengawas. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const { error, value } = userManageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, username, password, role, jabatan } = value;

    const existingUser = await prisma.user.findFirst({
      where: { username, deletedAt: null }
    });
    if (existingUser) return res.status(400).json({ error: 'Username sudah digunakan' });

    // Hash password menggunakan bcrypt
    const rawPassword = password && password.trim() !== '' ? password : username;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newPengawas = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'PENGAWAS',
        jabatan: jabatan || 'Pengawas Lapangan'
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
        action: 'USER_CREATE_PENGAWAS',
        actionType: 'USER_MANAGEMENT',
        actionId: newPengawas.id,
        details: JSON.stringify({ actorRole, targetUsername: username, targetRole: 'PENGAWAS' })
      }
    }).catch(() => {});

    res.status(201).json({ success: true, pengawas: newPengawas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Pengawas (Ubah Data Pengawas - Khusus Super Admin, Admin dilarang)
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan memodifikasi akun Pengawas. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const targetId = req.params.id;
    const { name, username, role, password, jabatan } = req.body;

    const existing = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Data pengawas tidak ditemukan' });
    }

    // Jika username diubah, pastikan tidak duplikat dengan akun lain
    if (username && username !== existing.username) {
      const duplicate = await prisma.user.findFirst({
        where: { username, id: { not: targetId }, deletedAt: null }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Username baru sudah digunakan oleh akun lain' });
      }
    }

    const updateData = {
      name: name || existing.name,
      username: username || existing.username,
      role: role ? normalizeRole(role) : existing.role,
      jabatan: jabatan !== undefined ? jabatan : existing.jabatan
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedPengawas = await prisma.user.update({
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
        action: 'USER_UPDATE_PENGAWAS',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: updatedPengawas.username, targetRole: updatedPengawas.role })
      }
    }).catch(() => {});

    res.json({ success: true, pengawas: updatedPengawas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE Pengawas (Hapus Pengawas - Khusus Super Admin, Admin dilarang)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak: Admin tidak diizinkan menghapus akun Pengawas. Hanya Super Admin yang memiliki hak akses ini.'
      });
    }

    const targetId = req.params.id;

    if (req.user && req.user.id === targetId) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' });
    }

    const existing = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Data pengawas tidak ditemukan' });
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
        action: 'USER_DELETE_PENGAWAS',
        actionType: 'USER_MANAGEMENT',
        actionId: targetId,
        details: JSON.stringify({ actorRole, targetUsername: existing.username, targetRole: existing.role })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Pengawas berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
