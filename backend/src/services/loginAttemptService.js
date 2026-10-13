const prisma = require('../config/prisma');

class LoginAttemptService {
  /**
   * Normalisasi username (hapus spasi depan/belakang)
   * @param {string} username 
   * @returns {string}
   */
  static normalizeUsername(username) {
    if (!username) return '';
    return String(username).trim();
  }

  /**
   * Catat kegagalan login kredensial untuk username tertentu
   * @param {string} username 
   * @returns {Promise<{ failedAttempts: number, showForgotPasswordPrompt: boolean }>}
   */
  static async recordFailedAttempt(username) {
    const normalized = this.normalizeUsername(username);
    if (!normalized) {
      return { failedAttempts: 0, showForgotPasswordPrompt: false };
    }

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO login_attempt (id, username, failedAttempts, lastFailedAt, createdAt, updatedAt)
         VALUES (UUID(), ?, 1, NOW(3), NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE
           failedAttempts = failedAttempts + 1,
           lastFailedAt = NOW(3),
           updatedAt = NOW(3)`,
        normalized
      );

      const rows = await prisma.$queryRawUnsafe(
        `SELECT failedAttempts FROM login_attempt WHERE username = ? LIMIT 1`,
        normalized
      );

      const failedAttempts = (rows && rows[0] && rows[0].failedAttempts) ? Number(rows[0].failedAttempts) : 1;
      return {
        failedAttempts,
        showForgotPasswordPrompt: failedAttempts >= 3
      };
    } catch (error) {
      console.error('Error recording failed login attempt:', error.message);
      // Graceful degradation: jangan sampai error tracking menggagalkan alur error normal
      return { failedAttempts: 0, showForgotPasswordPrompt: false };
    }
  }

  /**
   * Reset kegagalan login setelah berhasil autentikasi
   * @param {string} username 
   * @returns {Promise<boolean>}
   */
  static async resetFailedAttempts(username) {
    const normalized = this.normalizeUsername(username);
    if (!normalized) return false;

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE login_attempt SET failedAttempts = 0, lastFailedAt = NULL, updatedAt = NOW(3) WHERE username = ?`,
        normalized
      );
      return true;
    } catch (error) {
      console.error('Error resetting failed login attempts:', error.message);
      return false;
    }
  }

  /**
   * Ambil jumlah kegagalan saat ini
   * @param {string} username 
   * @returns {Promise<number>}
   */
  static async getFailedAttempts(username) {
    const normalized = this.normalizeUsername(username);
    if (!normalized) return 0;

    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT failedAttempts FROM login_attempt WHERE username = ? LIMIT 1`,
        normalized
      );
      return (rows && rows[0] && rows[0].failedAttempts) ? Number(rows[0].failedAttempts) : 0;
    } catch (error) {
      console.error('Error getting failed login attempts:', error.message);
      return 0;
    }
  }
}

module.exports = LoginAttemptService;
