const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const plateRecognitionService = require('../src/services/plateRecognitionService');
const scanTokenService = require('../src/services/scanTokenService');
const prisma = require('../src/config/prisma');

// Mock dependencies
jest.mock('../src/config/prisma', () => {
  const mockPrisma = {
    vehicle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    handover: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    issue: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  return mockPrisma;
});

jest.mock('../src/services/vehicleStatusService', () => ({
  reconcileVehicleOperationalStatus: jest.fn().mockImplementation(async (noPolisi) => ({
    vehicle: {
      id: 'VH-001',
      noPolisi: noPolisi || 'B 9504 TEI',
      status: 'READY_TO_START',
      isManualMaintenance: false
    },
    lastHandover: null,
    hasActiveMajorIssue: false
  }))
}));

jest.mock('../src/services/notificationService', () => ({
  sendNotification: jest.fn().mockResolvedValue(true),
  sendAmtComplianceNotification: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/utils/CacheService', () => ({
  delPattern: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true)
}));

// Mock Image Optimizer to preserve buffer
jest.mock('../src/middleware/imageOptimizer', () => {
  return (req, res, next) => {
    if (req.files) {
      req.files.forEach(f => {
        f.path = 'uploads/' + f.originalname;
        f.thumbnailUrl = 'uploads/thumb_' + f.originalname;
        f.previewUrl = 'uploads/preview_' + f.originalname;
        f.originalSize = f.size || (f.buffer ? f.buffer.length : 100);
      });
    }
    next();
  };
});

let mockCurrentUser = { id: 'USR-AMT-01', role: 'AMT', name: 'Ahmad Supardi', username: 'ahmad' };

jest.mock('../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = mockCurrentUser;
    next();
  },
  authorizeRole: () => (req, res, next) => next()
}));

const handoverRoutes = require('../src/routes/handovers');
const plateRecognitionRoutes = require('../src/routes/plateRecognition');

const app = express();
app.use(express.json());
app.use('/api/handovers', handoverRoutes);
app.use('/api/plate-recognition', plateRecognitionRoutes);

describe('Automatic License Plate Recognition (ALPR) - Comprehensive Test Suite', () => {
  const vehicleId = 'VH-001';
  const noPolisi = 'B 9504 TEI';
  const frontBuffer = Buffer.from('FAKE_JPEG_IMAGE_FRONT_PHOTO_BUFFER');
  const backBuffer = Buffer.from('FAKE_JPEG_IMAGE_BACK_PHOTO_BUFFER');
  const frontHash = plateRecognitionService.computeHash(frontBuffer);
  const backHash = plateRecognitionService.computeHash(backBuffer);

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = { id: 'USR-AMT-01', role: 'AMT', name: 'Ahmad Supardi', username: 'ahmad' };
    plateRecognitionService.enabled = true;
    plateRecognitionService.enforcementMode = 'enforce';

    prisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      noPolisi,
      status: 'READY_TO_START',
      isManualMaintenance: false
    });

    prisma.user.findFirst.mockResolvedValue({
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      role: mockCurrentUser.role,
      username: mockCurrentUser.username,
      deletedAt: null
    });

    prisma.$queryRaw.mockResolvedValue([{ count: 0 }]);
    prisma.issue.findMany.mockResolvedValue([]);
    prisma.auditLog.create.mockResolvedValue({ id: 'AUD-001' });

    // Mock $transaction to execute callback
    prisma.$transaction.mockImplementation(async (cb) => {
      const txMock = {
        vehicle: {
          findUnique: jest.fn().mockResolvedValue({
            id: vehicleId,
            noPolisi,
            status: 'READY_TO_START',
            isManualMaintenance: false
          }),
          update: jest.fn().mockResolvedValue({})
        },
        handover: {
          create: jest.fn().mockImplementation((args) => Promise.resolve({
            id: 'HO-20261105-0001',
            ...args.data
          }))
        },
        amtIssue: {
          create: jest.fn().mockResolvedValue({})
        }
      };
      return await cb(txMock);
    });
  });

  const generateSignedToken = (side, status, detectedPlate, buffer, customUser = null) => {
    const payload = {
      userId: customUser ? customUser.id : mockCurrentUser.id,
      vehicleId,
      noPolisi,
      side: side.toUpperCase(),
      photoHash: plateRecognitionService.computeHash(buffer),
      detectedPlate,
      confidence: status === 'MATCH' ? 0.98 : (status === 'MISMATCH' ? 0.95 : 0.2),
      status,
      method: 'AUTOMATIC_AI',
      modelInfo: 'YOLO+PaddleOCR',
      iat: Date.now(),
      exp: Date.now() + 10 * 60 * 1000
    };
    return plateRecognitionService.signPayload(payload);
  };

  const getValidSubmissionFields = (scanToken) => ({
    noPolisi,
    shift: '08:00',
    type: 'mulai',
    locationLat: -7.61875,
    locationLng: 109.14419,
    amt1: 'Ahmad Supardi',
    amt2: 'Budi Santoso',
    scanToken,
    items: JSON.stringify([
      { name: 'Kondisi Rem [MAJOR]', isGood: true, category: 'A' },
      { name: 'SIM B2 Umum', isGood: true, category: 'B' }
    ])
  });

  // =========================================================================
  // SKENARIO 1: Plat depan MATCH, plat belakang MATCH -> lolos otomatis
  // =========================================================================
  it('Skenario 1: Plat depan MATCH dan belakang MATCH -> lolos otomatis (status MATCH)', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MATCH', noPolisi, frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.handover.plateStatus).toBe('MATCH');
    expect(res.body.handover.plateOverallMatch).toBe(true);
    expect(res.body.handover.plateVerificationMethod).toBe('AUTOMATIC_AI');
  });

  // =========================================================================
  // SKENARIO 2: Plat depan MATCH, plat belakang MISMATCH -> ditolak untuk AMT
  // =========================================================================
  it('Skenario 2: Plat depan MATCH, plat belakang MISMATCH -> ditolak 400 untuk AMT', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MATCH', noPolisi, frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MISMATCH', 'B 1234 XYZ', backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Verifikasi Plat Nomor Gagal (MISMATCH)');
  });

  // =========================================================================
  // SKENARIO 3: Plat depan MISMATCH, plat belakang MATCH -> ditolak untuk AMT
  // =========================================================================
  it('Skenario 3: Plat depan MISMATCH, plat belakang MATCH -> ditolak 400 untuk AMT', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MISMATCH', 'B 9999 WRG', frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Verifikasi Plat Nomor Gagal (MISMATCH)');
  });

  // =========================================================================
  // SKENARIO 4: Plat depan UNREADABLE -> minta foto ulang (ditolak 400 enforce)
  // =========================================================================
  it('Skenario 4: Plat depan UNREADABLE -> ditolak 400 minta ambil ulang foto', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'UNREADABLE', null, frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('UNREADABLE');
  });

  // =========================================================================
  // SKENARIO 5: Override Pengawas dengan alasan valid (>= 5 karakter) -> lolos
  // =========================================================================
  it('Skenario 5: Plat mismatch di-override Pengawas dengan alasan valid (>= 5 char) -> lolos MANUAL_OVERRIDE', async () => {
    mockCurrentUser = { id: 'USR-PGW-01', role: 'PENGAWAS', name: 'Sekar Pengawas', username: 'sekar' };
    prisma.user.findFirst.mockResolvedValue({
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      role: mockCurrentUser.role,
      username: mockCurrentUser.username,
      deletedAt: null
    });

    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MISMATCH', 'B 9504 TX', frontBuffer, mockCurrentUser);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer, mockCurrentUser);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .field('plateOverride', 'true')
      .field('plateOverrideReason', 'Plat depan sedikit bengkok dan terhalang kabel, fisik sudah dicek')
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.handover.plateStatus).toBe('MANUAL_OVERRIDE');
    expect(res.body.handover.plateOverallMatch).toBe(true);
    expect(res.body.handover.plateVerificationMethod).toBe('MANUAL_OVERRIDE');
    expect(res.body.handover.plateOverrideBy).toBe('Sekar Pengawas');

    // Pastikan audit log dibuat
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ALPR_OVERRIDE',
          noPolisi
        })
      })
    );
  });

  // =========================================================================
  // SKENARIO 6: AMT mencoba override mandiri -> ditolak 403 Forbidden
  // =========================================================================
  it('Skenario 6: AMT mencoba override mandiri -> ditolak 403 Forbidden', async () => {
    mockCurrentUser = { id: 'USR-AMT-01', role: 'AMT', name: 'Ahmad Supardi', username: 'ahmad' };
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MISMATCH', 'B 1111 FAK', frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .field('plateOverride', 'true')
      .field('plateOverrideReason', 'Saya verifikasi sendiri aman')
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Awak Mobil Tangki (AMT) dilarang mengesahkan secara sepihak');
  });

  // =========================================================================
  // SKENARIO 7: Alasan override < 5 karakter -> ditolak 400 Bad Request
  // =========================================================================
  it('Skenario 7: Alasan override < 5 karakter -> ditolak 400 Bad Request', async () => {
    mockCurrentUser = { id: 'USR-ADMIN-01', role: 'ADMIN', name: 'Admin Fleet', username: 'admin' };
    prisma.user.findFirst.mockResolvedValue({
      id: mockCurrentUser.id,
      name: mockCurrentUser.name,
      role: mockCurrentUser.role,
      username: mockCurrentUser.username,
      deletedAt: null
    });

    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MISMATCH', 'B 8888 ABC', frontBuffer, mockCurrentUser);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer, mockCurrentUser);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .field('plateOverride', 'true')
      .field('plateOverrideReason', 'ok') // < 5 chars
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('minimal 5 karakter');
  });

  // =========================================================================
  // SKENARIO 8: scanToken TIDAK dikonsumsi saat ALPR gagal/retry
  // =========================================================================
  it('Skenario 8: scanToken tidak dikonsumsi saat ALPR mismatch / gagal', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MISMATCH', 'B 7777 BAD', frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    // Submission pertama gagal karena ALPR mismatch
    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);

    // Verifikasi bahwa scanToken MASIH VALID (belum terpakai)
    const checkVerify = scanTokenService.verify(scanToken, mockCurrentUser.id, vehicleId, 'mulai');
    expect(checkVerify.valid).toBe(true);
  });

  // =========================================================================
  // SKENARIO 9: scanToken dikonsumsi hanya saat submission handover berhasil
  // =========================================================================
  it('Skenario 9: scanToken dikonsumsi hanya saat submission handover berhasil', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'MATCH', noPolisi, frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(201);

    // Verifikasi bahwa scanToken SUDAH DIKONSUMSI (tidak bisa digunakan lagi)
    const checkVerify = scanTokenService.verify(scanToken, mockCurrentUser.id, vehicleId, 'mulai');
    expect(checkVerify.valid).toBe(false);
    expect(checkVerify.reason).toContain('sudah digunakan');
  });

  // =========================================================================
  // SKENARIO 10: Manipulasi plateToken (signature rusak/palsu) -> ditolak 400
  // =========================================================================
  it('Skenario 10: Manipulasi plateToken (signature palsu) -> ditolak 400 Bad Request', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const validToken = generateSignedToken('FRONT', 'MATCH', noPolisi, frontBuffer);
    // Rusak signature
    const parts = validToken.split('.');
    const tamperedToken = parts[0] + '.00112233445566778899aabbccddeeff';

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tamperedToken)
      .field('plateTokenBack', generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer))
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tidak valid (tampered)');
  });

  // =========================================================================
  // SKENARIO 11: Manipulasi file foto (hash foto != hash token) -> ditolak 400
  // =========================================================================
  it('Skenario 11: Manipulasi file foto (hash file berbeda dengan plateToken) -> ditolak 400', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    // Token dibuat dengan frontBuffer, tetapi yang dikirim adalah foto yang berbeda
    const tokenFront = generateSignedToken('FRONT', 'MATCH', noPolisi, frontBuffer);
    const differentPhotoBuffer = Buffer.from('TAMPERED_PHOTO_CONTENT_DIFFERENT_HASH');

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', generateSignedToken('BACK', 'MATCH', noPolisi, backBuffer))
      .attach('photos', differentPhotoBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Integritas file foto tidak cocok');
  });

  // =========================================================================
  // SKENARIO 12: Service AI offline (fail-safe) -> SERVICE_UNAVAILABLE
  // =========================================================================
  it('Skenario 12: Service AI offline (fail-safe mode) -> lolos dengan SERVICE_UNAVAILABLE fallback', async () => {
    const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
    const tokenFront = generateSignedToken('FRONT', 'SERVICE_UNAVAILABLE', null, frontBuffer);
    const tokenBack = generateSignedToken('BACK', 'SERVICE_UNAVAILABLE', null, backBuffer);

    const res = await request(app)
      .post('/api/handovers')
      .field(getValidSubmissionFields(scanToken))
      .field('plateTokenFront', tokenFront)
      .field('plateTokenBack', tokenBack)
      .attach('photos', frontBuffer, 'photo_Depan.jpg')
      .attach('photos', backBuffer, 'photo_Belakang.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.handover.plateStatus).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.handover.plateVerificationMethod).toBe('SERVICE_FALLBACK');
  });

  // =========================================================================
  // ROUTE API /api/plate-recognition TESTS
  // =========================================================================
  describe('POST /api/plate-recognition/recognize Endpoint Tests', () => {
    it('Harus mengembalikan 400 jika file foto tidak dilampirkan', async () => {
      const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
      const res = await request(app)
        .post('/api/plate-recognition/recognize')
        .field('noPolisi', noPolisi)
        .field('side', 'FRONT')
        .field('scanToken', scanToken);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('File foto kendaraan wajib diunggah');
    });

    it('Harus mengembalikan 400 jika sisi foto bukan FRONT atau BACK', async () => {
      const scanToken = scanTokenService.issue(mockCurrentUser.id, vehicleId, noPolisi, 'mulai');
      const res = await request(app)
        .post('/api/plate-recognition/recognize')
        .field('noPolisi', noPolisi)
        .field('side', 'KANAN')
        .field('scanToken', scanToken)
        .attach('photo', frontBuffer, 'photo_Kanan.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Sisi foto ALPR hanya berlaku untuk "FRONT" (Depan) atau "BACK" (Belakang)');
    });

    it('Harus mengembalikan 403 jika scanToken tidak valid saat recognize', async () => {
      const res = await request(app)
        .post('/api/plate-recognition/recognize')
        .field('noPolisi', noPolisi)
        .field('side', 'FRONT')
        .field('scanToken', 'INVALID_FAKE_SCAN_TOKEN')
        .attach('photo', frontBuffer, 'photo_Depan.jpg');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Otorisasi scan QR tidak valid');
    });

    it('Harus mengembalikan status dan health check pada GET /status', async () => {
      const res = await request(app).get('/api/plate-recognition/status');
      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
      expect(res.body.enforcementMode).toBe('enforce');
      expect(res.body.aiServiceHealth).toBeDefined();
    });
  });
});
