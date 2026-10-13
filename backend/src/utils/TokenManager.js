const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('FATAL: JWT_SECRET or REFRESH_SECRET is missing from environment!');
  }
}

class TokenManager {
  static getJwtSecret() {
    return process.env.JWT_SECRET || 'test_jwt_secret_must_be_set_in_env_variable';
  }

  static getRefreshSecret() {
    return process.env.REFRESH_SECRET || 'test_refresh_secret_must_be_set_in_env_variable';
  }

  static generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      TokenManager.getJwtSecret(),
      { expiresIn: '1h' }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      TokenManager.getRefreshSecret(),
      { expiresIn: '7d' }
    );
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, TokenManager.getJwtSecret());
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, TokenManager.getRefreshSecret());
  }
}

module.exports = TokenManager;
