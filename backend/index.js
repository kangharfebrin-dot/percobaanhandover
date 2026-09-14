require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
