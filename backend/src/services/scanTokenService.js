/**
 * ScanTokenService — Mekanisme otorisasi scan satu kali pakai (in-memory).
 *
 * TUJUAN:
 * Mencegah akses langsung ke endpoint submit handover tanpa melalui proses scan QR.
 * Token diikat pada: userId + vehicleId + processType (mulai/akhiri) + hanya 1x pakai.
 *
 * FITUR DUA TAHAP:
 * 1. verify(): Memeriksa keabsahan token tanpa menghanguskannya (digunakan saat ALPR / proses perantara).
 * 2. consume(): Memvalidasi dan langsung mengonsumsi token (hanya saat finalisasi submit handover).
 */

const crypto = require('crypto');

class ScanTokenService {
  constructor() {
    // Map: token -> { userId, vehicleId, noPolisi, processType, expiresAt, used }
    this.tokens = new Map();
    
    // Bersihkan token kedaluwarsa setiap 5 menit (unref agar tidak menahan proses exit / Jest)
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupTimer && this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Issue token baru setelah scan QR berhasil tervalidasi.
   * @param {string} userId - ID pengguna yang scan
   * @param {string} vehicleId - ID kendaraan yang di-scan
   * @param {string} noPolisi - Nomor polisi kendaraan
   * @param {string} processType - 'mulai' atau 'akhiri'
   * @param {number} ttlMs - Time-to-live dalam milidetik (default 15 menit)
   */
  issue(userId, vehicleId, noPolisi, processType, ttlMs = 15 * 60 * 1000) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + ttlMs;

    this.tokens.set(token, {
      userId,
      vehicleId,
      noPolisi,
      processType,
      expiresAt,
      used: false
    });

    return token;
  }

  /**
   * Verifikasi token tanpa mengonsumsinya (Read-Only Check).
   * Digunakan untuk validasi langkah perantara seperti ALPR Plate Recognition
   * sehingga token tidak hangus jika pembacaan plat gagal/retry.
   * @returns {{ valid: boolean, reason?: string, payload?: object }}
   */
  verify(token, userId, vehicleId, processType) {
    if (!token) {
      return { valid: false, reason: 'Token scan tidak ditemukan. Lakukan scan QR kendaraan terlebih dahulu.' };
    }

    const entry = this.tokens.get(token);

    if (!entry) {
      return { valid: false, reason: 'Token scan tidak valid atau sudah kedaluwarsa. Lakukan scan ulang.' };
    }

    if (entry.used) {
      return { valid: false, reason: 'Token scan sudah digunakan. Lakukan scan ulang.' };
    }

    if (Date.now() > entry.expiresAt) {
      return { valid: false, reason: 'Token scan sudah kedaluwarsa. Lakukan scan ulang (batas 15 menit).' };
    }

    if (userId && String(entry.userId) !== String(userId)) {
      return { valid: false, reason: 'Token scan tidak cocok dengan pengguna yang login.' };
    }

    if (vehicleId && String(entry.vehicleId) !== String(vehicleId)) {
      return { valid: false, reason: 'Token scan tidak cocok dengan kendaraan yang dimaksud.' };
    }

    if (processType && entry.processType !== processType) {
      return { valid: false, reason: `Token scan untuk proses "${entry.processType}", bukan "${processType}". Scan ulang.` };
    }

    return { valid: true, payload: entry };
  }

  /**
   * Verifikasi dan konsumsi token.
   * Token hanya dapat digunakan SATU KALI.
   * @returns {{ valid: boolean, reason?: string, payload?: object }}
   */
  consume(token, userId, vehicleId, processType) {
    const check = this.verify(token, userId, vehicleId, processType);
    if (!check.valid) {
      const entry = this.tokens.get(token);
      if (entry && (entry.used || Date.now() > entry.expiresAt)) {
        this.tokens.delete(token);
      }
      return check;
    }

    const entry = check.payload;

    // Konsumsi token — tandai sebagai sudah dipakai
    entry.used = true;
    this.tokens.set(token, entry);

    // Hapus setelah dikonsumsi (cleanup langsung)
    const cleanupTimer = setTimeout(() => this.tokens.delete(token), 1000);
    if (cleanupTimer && cleanupTimer.unref) cleanupTimer.unref();

    return { valid: true, payload: entry };
  }

  /**
   * Bersihkan token kedaluwarsa.
   */
  cleanup() {
    const now = Date.now();
    for (const [token, entry] of this.tokens.entries()) {
      if (now > entry.expiresAt || entry.used) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Jumlah token aktif (untuk monitoring/debugging).
   */
  activeCount() {
    return this.tokens.size;
  }
}

// Singleton — satu instance untuk seluruh proses server
module.exports = new ScanTokenService();
