const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');

class PlateRecognitionService {
  constructor() {
    this.serviceUrl = process.env.ALPR_SERVICE_URL || 'http://127.0.0.1:8000';
    this.jwtSecret = process.env.JWT_SECRET || 'pertamina_alpr_default_secret_key_2026';
    this.enabled = process.env.ALPR_ENABLED !== 'false';
    this.enforcementMode = (process.env.ALPR_ENFORCEMENT_MODE || 'shadow').toLowerCase(); // 'shadow' or 'enforce'
    this.tokenTtlMs = 20 * 60 * 1000; // 20 menit
  }

  /**
   * Hitung hash SHA-256 dari buffer file gambar.
   */
  computeHash(buffer) {
    if (!buffer) return null;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Buat tanda tangan HMAC-SHA256 untuk token verifikasi plat.
   */
  signPayload(payload) {
    const dataString = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', this.jwtSecret).update(dataString).digest('hex');
    const encodedPayload = Buffer.from(dataString).toString('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifikasi dan decode signed plate token.
   */
  verifyPlateToken(plateToken, options = {}) {
    if (!plateToken || typeof plateToken !== 'string') {
      return { valid: false, reason: 'Token verifikasi plat tidak ditemukan atau format tidak valid.' };
    }

    const parts = plateToken.split('.');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Format token verifikasi plat rusak (invalid segment count).' };
    }

    const [encodedPayload, receivedSignature] = parts;

    let payload;
    try {
      const dataString = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const expectedSignature = crypto.createHmac('sha256', this.jwtSecret).update(dataString).digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const receivedBuf = Buffer.from(receivedSignature, 'hex');
      const expectedBuf = Buffer.from(expectedSignature, 'hex');

      if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
        return { valid: false, reason: 'Tanda tangan token verifikasi plat tidak valid (tampered).' };
      }

      payload = JSON.parse(dataString);
    } catch (e) {
      return { valid: false, reason: 'Gagal mendekode token verifikasi plat: ' + e.message };
    }

    // Periksa masa berlaku token
    if (Date.now() > payload.exp) {
      return { valid: false, reason: 'Token verifikasi plat sudah kedaluwarsa. Lakukan foto ulang.' };
    }

    // Periksa userId jika diberikan
    if (options.userId && String(payload.userId) !== String(options.userId)) {
      return { valid: false, reason: 'Token verifikasi plat tidak cocok dengan pengguna yang login.' };
    }

    // Periksa vehicleId / noPolisi jika diberikan
    if (options.noPolisi) {
      const cleanExpected = options.noPolisi.replace(/\s+/g, '').toUpperCase();
      const cleanTokenPlate = (payload.noPolisi || '').replace(/\s+/g, '').toUpperCase();
      if (cleanExpected !== cleanTokenPlate) {
        return { valid: false, reason: `Token verifikasi plat tercatat untuk unit "${payload.noPolisi}", bukan "${options.noPolisi}".` };
      }
    }

    // Periksa sisi foto (FRONT / BACK) jika diberikan
    if (options.side && payload.side && payload.side.toUpperCase() !== options.side.toUpperCase()) {
      return { valid: false, reason: `Token verifikasi sisi "${payload.side}" tidak sesuai dengan sisi yang dikirim ("${options.side}").` };
    }

    // Verifikasi hash foto jika buffer foto asli disertakan
    if (options.photoBuffer) {
      const actualHash = this.computeHash(options.photoBuffer);
      if (actualHash !== payload.photoHash) {
        return { valid: false, reason: 'Integritas file foto tidak cocok dengan token verifikasi (file telah dimodifikasi).' };
      }
    }

    return { valid: true, payload };
  }

  /**
   * Kirim foto ke AI service Python FastAPI untuk pengenalan plat.
   */
  async recognizePlate({ imageBuffer, originalName = 'plate.jpg', mimeType = 'image/jpeg', side = 'FRONT', expectedPlate = '', userId = '', vehicleId = '' }) {
    const photoHash = this.computeHash(imageBuffer);
    const normalizedSide = (side || 'FRONT').toUpperCase();
    const cleanExpected = (expectedPlate || '').trim().toUpperCase();

    // Jika fitur ALPR dimatikan lewat config
    if (!this.enabled) {
      const payload = {
        userId: String(userId),
        vehicleId: String(vehicleId),
        noPolisi: cleanExpected,
        side: normalizedSide,
        photoHash,
        detectedPlate: null,
        confidence: 1.0,
        status: 'MATCH', // bypass saat disabled
        method: 'ALPR_DISABLED',
        iat: Date.now(),
        exp: Date.now() + this.tokenTtlMs
      };
      return {
        success: true,
        status: 'MATCH',
        detectedPlate: null,
        confidence: 1.0,
        matchesExpected: true,
        photoHash,
        plateToken: this.signPayload(payload),
        alprEnabled: false
      };
    }

    try {
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename: originalName,
        contentType: mimeType
      });
      if (cleanExpected) {
        form.append('expected_plate', cleanExpected);
      }
      form.append('side', normalizedSide);

      const response = await axios.post(`${this.serviceUrl}/v1/alpr/recognize`, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 12000 // 12s timeout
      });

      const data = response.data;
      const detectedPlate = data.detected_plate || null;
      const normalizedPlate = data.normalized_plate || null;
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0.0;
      const alprStatus = data.status || 'UNREADABLE';
      const matchesExpected = data.matches_expected;
      const modelInfo = data.model_info || 'YOLO+PaddleOCR';

      const payload = {
        userId: String(userId),
        vehicleId: String(vehicleId),
        noPolisi: cleanExpected,
        side: normalizedSide,
        photoHash,
        detectedPlate,
        confidence,
        status: alprStatus,
        method: 'AUTOMATIC_AI',
        modelInfo,
        iat: Date.now(),
        exp: Date.now() + this.tokenTtlMs
      };

      const plateToken = this.signPayload(payload);

      return {
        success: true,
        status: alprStatus,
        detectedPlate,
        normalizedPlate,
        expectedPlate: cleanExpected,
        confidence,
        detectionConfidence: data.detection_confidence || 0,
        ocrConfidence: data.ocr_confidence || 0,
        isValidIndonesianFormat: data.is_valid_indonesian_format || false,
        matchesExpected,
        boundingBox: data.bounding_box || null,
        processingTimeMs: data.processing_time_ms || 0,
        modelInfo,
        side: normalizedSide,
        photoHash,
        plateToken,
        alprEnabled: true
      };
    } catch (err) {
      console.warn(`[PlateRecognitionService] ALPR service error (${this.serviceUrl}):`, err.message);

      // Terbitkan token bertanda tangan dengan status SERVICE_UNAVAILABLE
      const payload = {
        userId: String(userId),
        vehicleId: String(vehicleId),
        noPolisi: cleanExpected,
        side: normalizedSide,
        photoHash,
        detectedPlate: null,
        confidence: 0.0,
        status: 'SERVICE_UNAVAILABLE',
        method: 'SERVICE_FALLBACK',
        errorMessage: err.message,
        iat: Date.now(),
        exp: Date.now() + this.tokenTtlMs
      };

      const plateToken = this.signPayload(payload);

      return {
        success: false,
        status: 'SERVICE_UNAVAILABLE',
        detectedPlate: null,
        confidence: 0.0,
        expectedPlate: cleanExpected,
        matchesExpected: false,
        side: normalizedSide,
        photoHash,
        plateToken,
        errorMessage: 'Layanan AI pengenal plat sedang tidak dapat dijangkau (timeout/offline).',
        alprEnabled: true
      };
    }
  }

  /**
   * Cek kesehatan koneksi internal ke service AI.
   */
  async checkServiceHealth() {
    try {
      const res = await axios.get(`${this.serviceUrl}/health`, { timeout: 3000 });
      return { online: res.status === 200, data: res.data };
    } catch (e) {
      return { online: false, error: e.message };
    }
  }
}

module.exports = new PlateRecognitionService();

