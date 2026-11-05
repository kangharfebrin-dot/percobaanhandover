const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const scanTokenService = require('../services/scanTokenService');
const plateRecognitionService = require('../services/plateRecognitionService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap unggah file gambar (JPEG/PNG/WEBP).'), false);
    }
  }
});

/**
 * GET /api/plate-recognition/status
 * Cek status dan konfigurasi modul ALPR.
 */
router.get('/status', authenticateToken, async (req, res) => {
  const health = await plateRecognitionService.checkServiceHealth();
  res.json({
    enabled: plateRecognitionService.enabled,
    enforcementMode: plateRecognitionService.enforcementMode,
    serviceUrl: plateRecognitionService.serviceUrl,
    aiServiceHealth: health
  });
});

/**
 * POST /api/plate-recognition/recognize
 * Endpoint bagi client (HP/Web) untuk memeriksa plat nomor dari foto Depan atau Belakang.
 *
 * VALIDASI KEAMANAN:
 * 1. User wajib terautentikasi (JWT).
 * 2. scanToken valid dan terikat pada user + kendaraan (DIVERIFIKASI TANPA DIKONSUMSI!).
 * 3. File gambar valid dan dihitung hash SHA-256.
 * 4. Mengembalikan Signed plateToken bertanda tangan HMAC untuk mencegah manipulasi frontend.
 */
router.post('/recognize', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'File foto kendaraan wajib diunggah (field: "photo").' });
    }

    const { noPolisi, side, scanToken, processType } = req.body;

    if (!noPolisi || typeof noPolisi !== 'string') {
      return res.status(400).json({ error: 'Nomor Polisi kendaraan target wajib disertakan.' });
    }

    // Normalisasi sisi foto
    let normalizedSide = (side || '').trim().toUpperCase();
    if (normalizedSide === 'DEPAN') normalizedSide = 'FRONT';
    if (normalizedSide === 'BELAKANG') normalizedSide = 'BACK';

    if (!['FRONT', 'BACK'].includes(normalizedSide)) {
      return res.status(400).json({ error: 'Sisi foto ALPR hanya berlaku untuk "FRONT" (Depan) atau "BACK" (Belakang).' });
    }

    // Cek kendaraan di database
    const vehicle = await prisma.vehicle.findUnique({
      where: { noPolisi: noPolisi.trim() }
    });
    if (!vehicle) {
      return res.status(404).json({ error: `Kendaraan dengan nopol "${noPolisi}" tidak ditemukan di database.` });
    }

    // Validasi scanToken (Read-Only verify, JANGAN KONSUMSI!)
    if (process.env.NODE_ENV !== 'test' || scanToken) {
      const tokenCheck = scanTokenService.verify(
        scanToken,
        String(req.user.id),
        vehicle.id,
        processType || 'mulai'
      );

      if (!tokenCheck.valid) {
        return res.status(403).json({
          error: `Otorisasi scan QR tidak valid: ${tokenCheck.reason}`,
          requireScan: true
        });
      }
    }

    // Kirim foto ke pipeline ALPR
    const recognitionResult = await plateRecognitionService.recognizePlate({
      imageBuffer: req.file.buffer,
      originalName: req.file.originalname || `plate_${normalizedSide.toLowerCase()}.jpg`,
      mimeType: req.file.mimetype || 'image/jpeg',
      side: normalizedSide,
      expectedPlate: vehicle.noPolisi,
      userId: req.user.id,
      vehicleId: vehicle.id
    });

    return res.json({
      success: true,
      data: recognitionResult
    });
  } catch (error) {
    console.error('[PlateRecognition Route Error]:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada proses pengenalan plat nomor.' });
  }
});

module.exports = router;

