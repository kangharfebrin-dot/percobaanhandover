require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const { sendPushNotification } = require('./src/config/firebase');
const { exportExcel, exportPdf } = require('./src/controllers/reportController');
const { getAnalytics } = require('./src/controllers/analyticsController');
const morgan = require('morgan');
const logger = require('./src/config/logger');
const promClient = require('prom-client');
const CacheService = require('./src/utils/CacheService');

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara_pertamina_123';

// Pastikan folder barcodes ada
const barcodesDir = path.join(__dirname, 'barcodes');
if (!fs.existsSync(barcodesDir)) {
  fs.mkdirSync(barcodesDir, { recursive: true });
}

const app = express();
const prisma = new PrismaClient();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./src/middleware/errorHandler');
const { loginSchema } = require('./src/validators/schemas');
const passwordResetRoutes = require('./src/routes/passwordReset');


const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_rahasia_negara_pertamina_123';

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());

// --- LOGGING & MONITORING (PHASE 3) ---
app.use(morgan('combined', { stream: logger.stream }));

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ register: promClient.register });

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'UP', message: 'Service is healthy' });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({ status: 'DOWN', message: 'Database connection failed' });
  }
});
// --------------------------------------


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api', limiter);
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/barcodes', express.static('barcodes'));
const optimizeImages = require('./src/middleware/imageOptimizer');
const upload = multer({ storage: multer.memoryStorage() });

// Middleware Autentikasi
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (token == null) return res.status(401).json({ error: 'Akses ditolak: Token tidak ditemukan' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Akses ditolak: Token tidak valid atau kadaluarsa' });
    req.user = user;
    next();
  });
}

// --- MOCK NOTIFICATION SYSTEM ---
async function sendNotification(handoverId, noPolisi, issueItems, isBlocked = false, type = 'NEW_ISSUE') {
  console.log('--- ADMIN NOTIFICATION ---');
  console.log(`Notifikasi: Kendaraan ${noPolisi}, Tipe: ${type}, Blocked: ${isBlocked}`);
  console.log('--------------------------');

  try {
    let host = process.env.SMTP_HOST;
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;
    let port = process.env.SMTP_PORT || 587;

    // Nodemailer test account (simulasi email) jika smtp user kosong di .env
    if (!user) {
      let testAccount = await nodemailer.createTestAccount();
      host = "smtp.ethereal.email";
      user = testAccount.user;
      pass = testAccount.pass;
    }

    let transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port == 465,
      auth: {
        user: user,
        pass: pass,
      },
    });

    const isResolved = type === 'RESOLVED';
    let subject = isResolved ? `[SELESAI] Perbaikan Kendaraan ${noPolisi}` : `[PERINGATAN] Isu Handover Kendaraan ${noPolisi}`;
    if (isBlocked) subject = `[BLOKIR - MAJOR] Isu Kendaraan ${noPolisi}`;

    let textBody = isResolved
      ? `Perbaikan pada kendaraan ${noPolisi} telah selesai dan kendaraan dapat beroperasi kembali.`
      : `Kendaraan ${noPolisi} dilaporkan memiliki beberapa isu:\n${issueItems.map(i => '- ' + i.name).join('\n')}\n\nStatus: ${isBlocked ? 'DIBLOKIR (Major)' : 'PERLU PERBAIKAN'}`;

    // Create DB Notification for Admin and Pengawas
    const notificationTitle = isResolved ? `Isu Selesai: ${noPolisi}` : (isBlocked ? `Kendaraan Diblokir: ${noPolisi}` : `Isu Baru: ${noPolisi}`);
    const notificationType = isResolved ? 'SUCCESS' : (isBlocked ? 'ERROR' : 'WARNING');
    const actionType = isResolved ? 'VIEW_HANDOVER' : 'VIEW_ISSUE';
    await prisma.notification.createMany({
      data: [
        { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'ADMIN', actionType, actionId: handoverId, noPolisi },
        { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'PENGAWAS', actionType, actionId: handoverId, noPolisi }
      ]
    });

    // Send FCM Push Notifications
    const targetUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'PENGAWAS'] },
        fcmToken: { not: null }
      }
    });

    for (const u of targetUsers) {
      if (u.fcmToken) {
        await sendPushNotification(
          u.fcmToken,
          notificationTitle,
          textBody,
          { handoverId, noPolisi, type }
        );
      }
    }

    // Remove the mock transporter.sendMail and rely on sendFindingReportEmail for emails,
    // or keep FCM push notifications here. We will keep FCM here.
    
    // We do not send email here anymore because the frontend will call /api/notifications/send-finding-email
    // Or we could send it here, but the instruction asks to use the hook.
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
  }
}



// --- API ROUTES ---

// 0. API Scan Barcode Kendaraan
app.get('/api/vehicles/scan/:barcode', async (req, res) => {
  try {
    const userId = req.query.userId;
    const vehicle = await prisma.vehicle.findUnique({ where: { barcode: req.params.barcode } });
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });

    // Cari riwayat terakhir kendaraan
    const lastHandover = await prisma.handover.findFirst({
      where: { noPolisi: vehicle.noPolisi },
      orderBy: { timestamp: 'desc' },
      include: {
        items: true,
        issue: true
      }
    });

    // Cek apakah user sedang memiliki pekerjaan "mulai" yang belum diakhiri dan tidak ada isu/kerusakan
    let activeUserHandover = null;
    if (userId) {
      const userLastHandover = await prisma.handover.findFirst({
        where: { userId: userId },
        orderBy: { timestamp: 'desc' },
        include: { issue: true, items: true }
      });

      if (userLastHandover && userLastHandover.type === 'mulai' && !userLastHandover.issue) {
        // Cek juga apakah ada kerusakan Major — jika iya, user tidak "aktif" di mobil itu
        const hasMajorBlock = userLastHandover.items?.some(item => !item.isGood && item.name.includes('[MAJOR]'));
        if (!hasMajorBlock) {
          activeUserHandover = userLastHandover;
        }
      }
    }

    res.json({ success: true, vehicle, lastHandover, activeUserHandover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Auth Login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { username, password } = value;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    let validPassword = false;

    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      validPassword = (password === user.password);
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    res.json({
      token,
      refreshToken,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, jabatan: user.jabatan }
    });
  } catch (error) {
    next(error);
  }
});

// 1a. Auth Refresh Token
app.post('/api/auth/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token diperlukan' });

  try {
    jwt.verify(refreshToken, REFRESH_SECRET, async (err, payload) => {
      if (err) return res.status(403).json({ error: 'Refresh token tidak valid' });

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ error: 'Refresh token tidak cocok atau expired' });
      }

      const newPayload = { id: user.id, username: user.username, role: user.role };
      const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({ token: newToken });
    });
  } catch (error) {
    next(error);
  }
});

// 1a. Auth Logout
app.post('/api/auth/logout', authenticateToken, async (req, res, next) => {
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

// 1c. Register FCM Token
app.post('/api/auth/fcm-token', authenticateToken, async (req, res, next) => {
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

// 1b. Auth Forgot Password (Diganti dengan modul baru)
app.use('/api/password-reset', passwordResetRoutes);

// Protect all /api routes except public endpoints
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/password-reset/request' || req.path.startsWith('/reports/')) return next();
  authenticateToken(req, res, next);
});

// 1.5 GET My Latest Handover (Untuk Cek Status Scan Mulai / Akhiri)
app.get('/api/handovers/my-active', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id;
      } catch (e) {
        // Token tidak valid/expired
      }
    }
    if (!userId && req.query.userId) {
      userId = req.query.userId;
    }

    if (!userId) {
      return res.json({ success: true, activeHandover: null });
    }

    const lastHandover = await prisma.handover.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: { issue: true, items: true }
    });

    if (!lastHandover) {
      return res.json({ success: true, activeHandover: null });
    }

    let vehicleData = null;
    if (lastHandover.noPolisi) {
      try {
        vehicleData = await prisma.vehicle.findUnique({
          where: { noPolisi: lastHandover.noPolisi }
        });
      } catch (e) {}
    }

    res.json({ 
      success: true, 
      activeHandover: {
        ...lastHandover,
        vehicle: vehicleData
      } 
    });
  } catch (error) {
    console.error('Error fetching my-active handover:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Submit Handover (Termasuk foto dan checklist)
app.post('/api/handovers', upload.any(), optimizeImages, async (req, res) => {
  try {
    const { userId, noPolisi, shift, type, locationLat, locationLng, items, amt1, amt2 } = req.body;
    const parsedItems = JSON.parse(items); // items dikirim sebagai string JSON jika form-data

    // Cek jika ada item yang "Tidak Baik / Tidak Ada" (isGood == false)
    const issueItems = parsedItems.filter(item => !item.isGood);
    const hasMajorIssue = issueItems.some(item => item.name.includes('[MAJOR]'));
    const status = issueItems.length > 0 ? 'Ada Masalah' : 'Siap Operasi (Normal)';

    // Pastikan user exists untuk menghindari Foreign Key Constraint error (terutama untuk akun dummy frontend)
    if (userId) {
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: userId,
            username: `dummy_${userId}`,
            password: '123',
            role: 'USER',
            name: 'Dummy User'
          }
        });
      }
    }

    // Filter file foto: pastikan foto 'Kerusakan_' hanya disimpan jika memang ada item terkait yang rusak
    const validFiles = (req.files || []).filter(file => {
      if (file.originalname) {
        let decodedName = file.originalname;
        try { decodedName = decodeURIComponent(file.originalname); } catch (e) { }
        if (decodedName.startsWith('Kerusakan_')) {
          // Jika tidak ada item bermasalah sama sekali, abaikan dan hapus file sampah
          if (issueItems.length === 0) {
            try {
              if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
              if (file.thumbnailUrl && fs.existsSync(file.thumbnailUrl)) fs.unlinkSync(file.thumbnailUrl);
              if (file.previewUrl && fs.existsSync(file.previewUrl)) fs.unlinkSync(file.previewUrl);
            } catch (e) { }
            return false;
          }

          // Cek apakah ada item rusak yang namanya cocok
          const rawPhotoItemName = decodedName.replace('Kerusakan_', '').split('.')[0].replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase().trim();
          const isItemDamaged = issueItems.some(it => {
            const cleanItemName = it.name.replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase().trim();
            return cleanItemName.includes(rawPhotoItemName) || rawPhotoItemName.includes(cleanItemName);
          });

          if (!isItemDamaged) {
            try {
              if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
              if (file.thumbnailUrl && fs.existsSync(file.thumbnailUrl)) fs.unlinkSync(file.thumbnailUrl);
              if (file.previewUrl && fs.existsSync(file.previewUrl)) fs.unlinkSync(file.previewUrl);
            } catch (e) { }
            return false;
          }
        }
      }
      return true;
    });

    // Simpan ke DB
    const handover = await prisma.handover.create({
      data: {
        userId,
        noPolisi,
        shift,
        type: type || 'mulai',
        status,
        amt1: amt1 || null,
        amt2: amt2 || null,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        items: {
          create: parsedItems.map(item => ({
            category: item.category,
            name: item.name,
            isGood: item.isGood
          }))
        },
        // Jika ada file terupload, simpan referensinya
        photos: {
          create: validFiles.map(file => {
            let photoType = 'TERLAMPIR';
            if (file.originalname) {
              let decodedOrig = file.originalname;
              try { decodedOrig = decodeURIComponent(file.originalname); } catch (e) { }
              const nameWithoutExt = decodedOrig.split('.')[0];
              if (nameWithoutExt.startsWith('photo_')) {
                photoType = nameWithoutExt.replace('photo_', '');
              } else if (nameWithoutExt.startsWith('Kerusakan_')) {
                photoType = nameWithoutExt.replace('Kerusakan_', 'Kerusakan: ');
              } else {
                photoType = nameWithoutExt;
              }
            }
            return {
              type: photoType,
              url: file.path.replace(/\\/g, '/'),
              thumbnailUrl: file.thumbnailUrl ? file.thumbnailUrl.replace(/\\/g, '/') : null,
              previewUrl: file.previewUrl ? file.previewUrl.replace(/\\/g, '/') : null,
              originalSize: file.originalSize || 0
            };
          })
        },
        issue: status === 'Ada Masalah' ? {
          create: { status: 'ONGOING' }
        } : undefined
      }
    });

    // Jika ada masalah, kirim notifikasi/email ke admin
    if (issueItems.length > 0) {
      await sendNotification(handover.id, noPolisi, issueItems, hasMajorIssue, 'NEW_ISSUE');
    }

    if (hasMajorIssue) {
      await prisma.vehicle.update({
        where: { noPolisi: noPolisi },
        data: { status: 'Maintenance' }
      });
    }

    // Invalidate cached handovers
    await CacheService.delPattern('handovers:page:*');

    res.status(201).json({ success: true, handover });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Handovers (Untuk Admin / History) - Dengan Paginasi & Caching
app.get('/api/handovers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `handovers:page:${page}:limit:${limit}`;
    const cachedData = await CacheService.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const handovers = await prisma.handover.findMany({
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, jabatan: true } },
        items: true,
        photos: true,
        issue: true
      }
    });

    const total = await prisma.handover.count();

    const responseData = {
      data: handovers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the response for 1 hour (3600 seconds)
    await CacheService.set(cacheKey, responseData, 3600);

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3.1 Get Single Handover by ID
app.get('/api/handovers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let handover = await prisma.handover.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, jabatan: true } },
        items: true,
        photos: true,
        issue: true
      }
    });

    if (!handover) {
      // Fallback: check if id is an issueId
      const issue = await prisma.issue.findUnique({
        where: { id },
        select: { handoverId: true }
      });
      if (issue && issue.handoverId) {
        handover = await prisma.handover.findUnique({
          where: { id: issue.handoverId },
          include: {
            user: { select: { name: true, jabatan: true } },
            items: true,
            photos: true,
            issue: true
          }
        });
      }
    }

    if (!handover) {
      return res.status(404).json({ error: 'Data riwayat handover tidak ditemukan.' });
    }

    res.json({ success: true, handover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3a. Export Handovers to Excel & PDF
app.get('/api/reports/excel', authenticateToken, exportExcel);
app.get('/api/reports/pdf', authenticateToken, exportPdf);

// 4. Dashboard Analytics
app.get('/api/dashboard/analytics', authenticateToken, getAnalytics);

// 5. PUT Handover (Selesaikan Isu)
app.put('/api/handovers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedHandover = await prisma.handover.update({
      where: { id },
      data: { status },
      include: { issue: true }
    });

    if (status === 'Siap Operasi (Normal)') {
      await sendNotification(updatedHandover.id, updatedHandover.noPolisi, [], false, 'RESOLVED');
      await prisma.vehicle.update({ where: { noPolisi: updatedHandover.noPolisi }, data: { status: 'Active' } });
    }

    res.json({ success: true, handover: updatedHandover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. GET All Vehicles (Untuk Admin)
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. POST Vehicle (Tambah Truk Baru)
app.post('/api/vehicles', async (req, res) => {
  try {
    const { noPolisi, barcode, jenisKendaraan, brand, status } = req.body;

    // Validasi input
    if (!noPolisi || !barcode) {
      return res.status(400).json({ error: 'No Polisi dan Barcode harus diisi' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        noPolisi,
        barcode,
        jenisKendaraan,
        brand,
        status: status || 'Baik'
      }
    });

    // Generate QR Code image in HD
    const qrPath = path.join(barcodesDir, `${barcode}.png`);
    await QRCode.toFile(qrPath, barcode, { errorCorrectionLevel: 'H', width: 1024, margin: 4, color: { dark: '#000000', light: '#FFFFFF' } });

    res.status(201).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5a. PUT Vehicle (Ubah Truk)
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { noPolisi, barcode, jenisKendaraan, brand, status } = req.body;
    const vehicleId = req.params.id;

    // Cek kendaraan lama
    const oldVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!oldVehicle) {
      return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { noPolisi, barcode, jenisKendaraan, brand, status: status || oldVehicle.status }
    });

    // Jika barcode berubah, generate QR code baru dan hapus yang lama
    if (oldVehicle.barcode !== barcode) {
      const oldQrPath = path.join(barcodesDir, `${oldVehicle.barcode}.png`);
      if (fs.existsSync(oldQrPath)) {
        fs.unlinkSync(oldQrPath);
      }
      const newQrPath = path.join(barcodesDir, `${barcode}.png`);
      await QRCode.toFile(newQrPath, barcode, { errorCorrectionLevel: 'H', width: 1024, margin: 4, color: { dark: '#000000', light: '#FFFFFF' } });
    }

    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5b. DELETE Vehicle (Hapus Truk)
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    // Hapus QR code
    const qrPath = path.join(barcodesDir, `${vehicle.barcode}.png`);
    if (fs.existsSync(qrPath)) {
      fs.unlinkSync(qrPath);
    }

    res.json({ success: true, message: 'Kendaraan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. PUT Vehicle Status (Ubah ke Maintenance / Active)
app.put('/api/vehicles/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 7. GET Workers (Pekerja)
app.get('/api/workers', async (req, res) => {
  try {
    // Ambil user dengan role AMT atau USER
    const workers = await prisma.user.findMany({
      where: {
        role: {
          in: ['AMT', 'USER']
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. POST Worker (Tambah Pekerja)
app.post('/api/workers', async (req, res) => {
  try {
    const { name, username, password, role, jabatan } = req.body;

    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const newWorker = await prisma.user.create({
      data: {
        name,
        username,
        password: password ? password : username,
        role: role || 'AMT',
        jabatan: jabatan || null
      }
    });
    res.status(201).json({ success: true, worker: newWorker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. PUT Worker (Ubah Data Pekerja)
app.put('/api/workers/:id', async (req, res) => {
  try {
    const { name, username, role, password, jabatan } = req.body;

    const updateData = { name, username, role, jabatan };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const updatedWorker = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, worker: updatedWorker });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. DELETE Worker (Hapus Pekerja)
app.delete('/api/workers/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Pekerja berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- PENGAWAS ROUTES ---
app.get('/api/pengawas', async (req, res) => {
  try {
    const pengawas = await prisma.user.findMany({
      where: { role: { in: ['PENGAWAS', 'ADMIN'] } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pengawas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pengawas', async (req, res) => {
  try {
    const { name, username, password, role, jabatan } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username sudah digunakan' });
    const newPengawas = await prisma.user.create({
      data: { name, username, password: password ? password : username, role: role || 'PENGAWAS', jabatan: jabatan || null }
    });
    res.status(201).json({ success: true, pengawas: newPengawas });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/pengawas/:id', async (req, res) => {
  try {
    const { name, username, role, password, jabatan } = req.body;
    const updateData = { name, username, role, jabatan };
    if (password && password.trim() !== '') updateData.password = password;
    const updatedPengawas = await prisma.user.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, pengawas: updatedPengawas });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/pengawas/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Pengawas berhasil dihapus' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- CHECKLIST ROUTES ---

// GET All Checklists
app.get('/api/checklists', async (req, res) => {
  try {
    const items = await prisma.checklistItem.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST New Checklist Item
app.post('/api/checklists', async (req, res) => {
  try {
    const { name, category, severity } = req.body;
    const newItem = await prisma.checklistItem.create({
      data: { name, category, severity }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update Checklist Item
app.put('/api/checklists/:id', async (req, res) => {
  try {
    const { name, category, severity } = req.body;
    const updated = await prisma.checklistItem.update({
      where: { id: req.params.id },
      data: { name, category, severity }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Checklist Item
app.delete('/api/checklists/:id', async (req, res) => {
  try {
    await prisma.checklistItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ISSUE ROUTES ---

// GET Ongoing Issues
app.get('/api/issues/ongoing', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: { in: ['ONGOING', 'PENDING_APPROVAL'] } },
      include: {
        handover: {
          include: { user: true, items: true, photos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET All Issues
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        handover: {
          include: { user: true, items: true, photos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Resolve Issue
app.put('/api/issues/:id/resolve', async (req, res) => {
  try {
    const updatedIssue = await prisma.issue.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });
    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Verify Repair
app.post('/api/issues/:id/verify-repair', upload.any(), optimizeImages, async (req, res) => {
  try {
    const issueId = req.params.id;
    const { itemsData } = req.body;
    const items = JSON.parse(itemsData || '[]');

    // Update each item
    for (const item of items) {
      const file = (req.files || []).find(f => f.fieldname === 'photo_' + item.id);
      let photoUrl = null;
      if (file) {
        photoUrl = file.path.replace(/\\/g, '/');
      }

      await prisma.handoverItem.update({
        where: { id: item.id },
        data: {
          repairNote: item.repairNote,
          repairPhotoUrl: photoUrl,
          isRepaired: true
        }
      });
    }

    // Update Issue status to PENDING_APPROVAL
    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'PENDING_APPROVAL',
        repairRequestedAt: new Date()
      },
      include: {
        handover: { include: { items: true } }
      }
    });

    res.json({ success: true, issue: updatedIssue });

    // Notify Admin & Pengawas that repair verification needs review
    const vehicleNoPolisi = updatedIssue.handover?.noPolisi || '';
    try {
      await prisma.notification.createMany({
        data: [
          {
            title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
            message: `AMT telah mengirim bukti perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan setujui/tolak.`,
            type: 'INFO',
            targetRole: 'ADMIN',
            actionType: 'VIEW_ISSUE',
            actionId: issueId,
            noPolisi: vehicleNoPolisi
          },
          {
            title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
            message: `AMT telah mengirim bukti perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan setujui/tolak.`,
            type: 'INFO',
            targetRole: 'PENGAWAS',
            actionType: 'VIEW_ISSUE',
            actionId: issueId,
            noPolisi: vehicleNoPolisi
          }
        ]
      });
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST Evaluate Repair (Admin/Pengawas)
app.post('/api/issues/:id/evaluate-repair', async (req, res) => {
  try {
    const issueId = req.params.id;
    const { evaluations } = req.body; // Array of { itemId, approved, reason }

    let allApproved = true;

    for (const evalItem of evaluations) {
      if (evalItem.approved) {
        // Item is approved, keep isRepaired true
        await prisma.handoverItem.update({
          where: { id: evalItem.itemId },
          data: {
            isRepaired: true,
            adminRejectionNote: null // Clear any previous rejection note
          }
        });
      } else {
        // Item is rejected
        allApproved = false;
        await prisma.handoverItem.update({
          where: { id: evalItem.itemId },
          data: {
            isRepaired: false,
            adminRejectionNote: evalItem.reason || 'Ditolak oleh Admin'
          }
        });
      }
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { handover: true }
    });

    if (allApproved) {
      // Resolve the issue
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user ? req.user.name : null
        }
      });

      // 3. Ubah status kendaraan menjadi READY_TO_START
      await prisma.vehicle.update({
        where: { noPolisi: issue.handover.noPolisi },
        data: { status: 'READY_TO_START' }
      });

      // 4. Buat/siapkan sesi pekerjaan baru dengan status NOT_STARTED
      // Kita buat type = 'akhiri' agar scan selanjutnya diwajibkan 'mulai'
      await prisma.handover.create({
        data: {
          userId: issue.handover.userId,
          noPolisi: issue.handover.noPolisi,
          shift: issue.handover.shift,
          type: 'akhiri', 
          status: 'NOT_STARTED',
        }
      });

      // Optionally create notification for AMT
      await prisma.notification.create({
        data: {
          title: 'Perbaikan Disetujui',
          message: `Perbaikan untuk truk ${issue.handover.noPolisi} telah disetujui. Kendaraan siap jalan.`,
          type: 'SUCCESS',
          targetRole: 'USER',
          actionType: 'VIEW_HANDOVER',
          actionId: issue.handoverId,
          noPolisi: issue.handover.noPolisi,
          isRead: false
        }
      });
      res.json({ success: true, issue: updatedIssue, status: 'RESOLVED' });
    } else {
      // Reject the issue, back to ONGOING
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: 'ONGOING'
        }
      });
      // Create notification for AMT
      await prisma.notification.create({
        data: {
          title: 'Perbaikan Ditolak',
          message: `Beberapa perbaikan untuk truk ${issue.handover.noPolisi} ditolak. Silakan periksa catatan Admin dan perbaiki kembali.`,
          type: 'WARNING',
          targetRole: 'USER',
          actionType: 'SCAN_REPAIR',
          actionId: issueId,
          noPolisi: issue.handover.noPolisi,
          isRead: false
        }
      });
      res.json({ success: true, issue: updatedIssue, status: 'ONGOING' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    let targetRoles = [];
    if (role === 'AMT' || role === 'USER') {
      targetRoles = ['USER', 'AMT', 'ALL'];
    } else if (role === 'PENGAWAS') {
      targetRoles = ['PENGAWAS', 'ALL'];
    } else {
      // ADMIN, SUPER_ADMIN
      // Menampilkan notifikasi untuk Admin dan Super Admin (pisahkan dengan Pengawas)
      targetRoles = ['ADMIN', 'SUPER_ADMIN', 'ALL'];
    }
    const notifications = await prisma.notification.findMany({
      where: { targetRole: { in: targetRoles } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, notification: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT} (0.0.0.0)`);
});
