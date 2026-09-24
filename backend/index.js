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

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara_pertamina_123';

// Pastikan folder barcodes ada
const barcodesDir = path.join(__dirname, 'barcodes');
if (!fs.existsSync(barcodesDir)) {
  fs.mkdirSync(barcodesDir, { recursive: true });
}

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/barcodes', express.static('barcodes'));
// Setup Multer for photo uploads (in memory for now, or save to disk)
const upload = multer({ dest: 'uploads/' });

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
async function sendNotification(handoverId, noPolisi, issueItems) {
  console.log('--- ADMIN NOTIFICATION ---');
  console.log(`Peringatan: Kendaraan ${noPolisi} memiliki isu saat handover!`);
  console.log(`Handover ID: ${handoverId}`);
  console.log('Isu ditemukan pada item:', issueItems.map(i => i.name).join(', '));
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

    let info = await transporter.sendMail({
      from: user,
      to: process.env.ADMIN_EMAIL || "admin@amt.local",
      subject: `[PERINGATAN] Isu Handover Kendaraan ${noPolisi}`,
      text: `Kendaraan ${noPolisi} dilaporkan memiliki beberapa isu:\n${issueItems.map(i => '- ' + i.name).join('\n')}`,
    });

    console.log("Email terkirim: %s", info.messageId);
    if (!process.env.SMTP_USER) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Gagal mengirim email simulasi:", error);
  }
}

// --- API ROUTES ---

// 0. API Scan Barcode Kendaraan
app.get('/api/vehicles/scan/:barcode', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { barcode: req.params.barcode } });
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    let validPassword = false;
    
    // Cek apakah password sudah di-hash (bcrypt hash biasanya dimulai dengan $2b$ atau $2a$)
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      // Fallback untuk pekerja lama yang password-nya belum di-hash di database
      validPassword = (password === user.password);
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, jabatan: user.jabatan } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protect all /api routes except /api/auth/login and /api/handovers/export
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/handovers/export') return next();
  authenticateToken(req, res, next);
});

// 2. Submit Handover (Termasuk foto dan checklist)
app.post('/api/handovers', upload.array('photos', 4), async (req, res) => {
  try {
    const { userId, noPolisi, shift, locationLat, locationLng, items, amt1, amt2 } = req.body;
    const parsedItems = JSON.parse(items); // items dikirim sebagai string JSON jika form-data

    // Cek jika ada item yang "Tidak Baik / Tidak Ada" (isGood == false)
    const issueItems = parsedItems.filter(item => !item.isGood);
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

    // Simpan ke DB
    const handover = await prisma.handover.create({
      data: {
        userId,
        noPolisi,
        shift,
        status,
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
          create: req.files ? req.files.map(file => ({
            type: 'TERLAMPIR', // Untuk detail, bisa dipisah berdasarkan nama field
            url: file.path.replace(/\\/g, '/')
          })) : []
        },
        issue: status === 'Ada Masalah' ? {
          create: { status: 'ONGOING' }
        } : undefined
      }
    });

    // Jika ada masalah, kirim notifikasi/email ke admin
    if (issueItems.length > 0) {
      await sendNotification(handover.id, noPolisi, issueItems);
    }

    res.status(201).json({ success: true, handover });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Handovers (Untuk Admin / History) - Dengan Paginasi
app.get('/api/handovers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

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

    // Mengambil total count untuk frontend jika butuh tahu apakah masih ada data
    const total = await prisma.handover.count();
    
    res.json({
      data: handovers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3a. Export Handovers to Excel
app.get('/api/handovers/export', async (req, res) => {
  try {
    const handovers = await prisma.handover.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, jabatan: true } },
        items: true
      }
    });

    const exportData = handovers.map(h => {
      const issueItems = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      return {
        'Waktu': h.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        'Nama Pekerja': h.user.name,
        'Jabatan': h.user.jabatan || '-',
        'No Polisi': h.noPolisi,
        'Shift': h.shift,
        'Status': h.status,
        'Detail Isu': issueItems || '-'
      };
    });

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Riwayat_Handover');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Handover.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3b. PUT Handover (Selesaikan Isu)
app.put('/api/handovers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedHandover = await prisma.handover.update({
      where: { id },
      data: { status }
    });
    
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
      where: { status: 'ONGOING' },
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT} (0.0.0.0)`);
});
