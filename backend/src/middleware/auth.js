const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in environment variables!');
}

/**
 * Normalisasi role resmi DIGI Handover:
 * 1. SUPER_ADMIN tetap SUPER_ADMIN (wewenang tertinggi, role independen).
 * 2. ADMIN tetap ADMIN.
 * 3. PENGAWAS tetap PENGAWAS.
 * 4. AMT tetap AMT.
 * 5. USER (legacy) dinormalisasi menjadi AMT untuk kompatibilitas ke belakang.
 */
const normalizeRole = (role) => {
  if (!role) return role;
  const r = String(role).trim().toUpperCase();
  if (r === 'USER') return 'AMT';
  return r;
};

const prisma = require('../config/prisma');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Hanya izinkan token di query string untuk endpoint download file/ekspor
  if (!token && req.query && req.query.token) {
    const isDownloadPath = req.baseUrl.includes('/reports') || req.path.includes('/download') || req.path.includes('/export');
    if (isDownloadPath) {
      token = req.query.token;
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak: Token tidak ditemukan' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      return res.status(401).json({
        error: 'Akses ditolak: Token tidak valid atau kadaluarsa',
        isTokenExpired: err.name === 'TokenExpiredError'
      });
    }

    try {
      // Pastikan akun masih aktif (tidak di-soft-delete) di database
      const dbUser = await prisma.user.findFirst({
        where: { id: decodedUser.id },
        select: { id: true, role: true, name: true, username: true, jabatan: true, deletedAt: true }
      });

      if (dbUser && dbUser.deletedAt !== null) {
        return res.status(401).json({
          error: 'Akses ditolak: Akun pengguna telah dinonaktifkan atau dihapus'
        });
      }

      if (!dbUser && process.env.NODE_ENV !== 'test') {
        return res.status(401).json({
          error: 'Akses ditolak: Akun pengguna tidak ditemukan atau telah dinonaktifkan'
        });
      }

      req.user = {
        ...decodedUser,
        role: normalizeRole(dbUser ? dbUser.role : decodedUser.role),
        name: dbUser?.name || decodedUser.name || decodedUser.username,
        username: dbUser?.username || decodedUser.username,
        jabatan: dbUser?.jabatan || decodedUser.jabatan
      };
      next();
    } catch (dbErr) {
      console.error('Auth middleware database error:', dbErr);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem pada verifikasi autentikasi' });
    }
  });
};

const authorizeRole = (...allowedRoles) => {
  // Support both authorizeRole(['ADMIN', 'PENGAWAS']) and authorizeRole('ADMIN', 'PENGAWAS')
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak: Autentikasi diperlukan' });
    }

    const effectiveRole = normalizeRole(req.user.role);
    const normalizedAllowed = roles.map(normalizeRole);

    if (normalizedAllowed.includes(effectiveRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Akses ditolak: Peran '${req.user.role}' tidak diizinkan mengakses resource ini`
    });
  };
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    authorizeRole('ADMIN', 'SUPER_ADMIN')(req, res, next);
  });
};

const requireSuperAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    authorizeRole('SUPER_ADMIN')(req, res, next);
  });
};

module.exports = {
  authMiddleware,
  authenticateToken: authMiddleware,
  authorizeRole,
  adminMiddleware,
  requireSuperAdmin,
  normalizeRole
};
