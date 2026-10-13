const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const prisma = require('../config/prisma');
const { loginSchema } = require('../validators/schemas');
const { authenticateToken, normalizeRole } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET or REFRESH_SECRET is missing from environment!');
}

const LoginAttemptService = require('../services/loginAttemptService');

// 1. Auth Login (Bcrypt verification, consecutive failure tracking without 15-minute lockout)
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { username, password } = value;
    const normalizedUsername = LoginAttemptService.normalizeUsername(username);

    const user = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
        deletedAt: null // B7: Jangan izinkan user yang telah di-soft-delete login
      }
    });

    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!user || !isPasswordValid) {
      // Hitung kegagalan kredensial secara server-side tanpa membocorkan keberadaan username
      const attemptInfo = await LoginAttemptService.recordFailedAttempt(normalizedUsername);
      return res.status(401).json({
        error: 'Username atau password salah',
        failedAttempts: attemptInfo.failedAttempts,
        showForgotPasswordPrompt: attemptInfo.showForgotPasswordPrompt
      });
    }

    // Reset kegagalan login untuk username terkait setelah autentikasi berhasil
    await LoginAttemptService.resetFailedAttempts(normalizedUsername);

    const effectiveRole = normalizeRole(user.role);
    const payload = { id: user.id, username: user.username, name: user.name, role: effectiveRole };
    
    // Access token berdurasi 1 jam (1h) sesuai standar rotasi keamanan
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: effectiveRole,
        jabatan: user.jabatan
      }
    });
  } catch (error) {
    next(error);
  }
});

// 1a. Auth Refresh Token dengan penanganan error aman & rotasi token
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token diperlukan' });

  try {
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (jwtErr) {
      return res.status(403).json({ error: 'Refresh token tidak valid atau kadaluarsa' });
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.id, deletedAt: null }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token tidak cocok atau telah dicabut' });
    }

    const effectiveRole = normalizeRole(user.role);
    const newPayload = { id: user.id, username: user.username, name: user.name, role: effectiveRole };
    const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign(newPayload, REFRESH_SECRET, { expiresIn: '7d' });

    // Rotasi refresh token: perbarui token lama ke token baru
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
});

// 1b. Auth Logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });
    res.json({ success: true, message: 'Berhasil logout' });
  } catch (error) {
    next(error);
  }
});

// 1c. Change Password (Pengguna mengganti password sendiri)
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password saat ini tidak sesuai' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        refreshToken: null // Cabut sesi lama untuk keamanan
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD_SELF',
        actionType: 'AUTH',
        actionId: user.id,
        details: JSON.stringify({ username: user.username })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Password berhasil diubah. Sesi lama telah dicabut.' });
  } catch (error) {
    next(error);
  }
});

// 1c. Auth Me (Validasi sesi & ambil profil terbaru langsung dari database)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        jabatan: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Sesi tidak valid: Akun tidak ditemukan atau telah dinonaktifkan'
      });
    }

    const effectiveRole = normalizeRole(user.role);

    res.json({
      success: true,
      user: {
        ...user,
        role: effectiveRole
      }
    });
  } catch (error) {
    next(error);
  }
});

// 1d. Register FCM Token
router.post('/fcm-token', authenticateToken, async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'FCM Token diperlukan' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken }
    });
    res.json({ success: true, message: 'FCM Token berhasil disimpan' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
