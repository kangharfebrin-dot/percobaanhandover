const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara_pertamina_123';

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (token == null) return res.status(401).json({ error: 'Akses ditolak: Token tidak ditemukan' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Akses ditolak: Token tidak valid atau kadaluarsa' });
    req.user = user;
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  exports.authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Akses ditolak: Hanya admin yang bisa mengakses resource ini' });
    }
  });
};

exports.authenticateToken = exports.authMiddleware;

exports.authorizeRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Akses ditolak: Role tidak diizinkan' });
    }
  };
};
