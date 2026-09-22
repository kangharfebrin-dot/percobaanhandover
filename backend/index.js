require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

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

// 1. Auth Login (Sederhana tanpa JWT untuk prototipe)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    // Untuk prototipe, kembalikan data user langsung
    res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Submit Handover (Termasuk foto dan checklist)
app.post('/api/handovers', upload.array('photos', 4), async (req, res) => {
  try {
    const { userId, noPolisi, shift, locationLat, locationLng, items } = req.body;
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
            url: file.path
          })) : []
        }
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

// 3. Get Handovers (Untuk Admin / History)
app.get('/api/handovers', async (req, res) => {
  try {
    const handovers = await prisma.handover.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true } },
        items: true,
        photos: true
      }
    });
    res.json(handovers);
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
    const qrPath = path.join(barcodesDir, `${barcode}.jpg`);
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
      const oldQrPath = path.join(barcodesDir, `${oldVehicle.barcode}.jpg`);
      if (fs.existsSync(oldQrPath)) {
        fs.unlinkSync(oldQrPath);
      }
      const newQrPath = path.join(barcodesDir, `${barcode}.jpg`);
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
    const qrPath = path.join(barcodesDir, `${vehicle.barcode}.jpg`);
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
    const { name, username, password, role } = req.body;
    
    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const newWorker = await prisma.user.create({
      data: {
        name,
        username,
        password, // Dalam aplikasi nyata, password harus di-hash (misal dg bcrypt)
        role: role || 'AMT'
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
    const { name, username, role, password } = req.body;
    
    const updateData = { name, username, role };
    if (password) {
      updateData.password = password; // Jika password diisi, ikut diubah
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
