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

// Setup Multer for photo uploads (in memory for now, or save to disk)
const upload = multer({ dest: 'uploads/' });

// --- MOCK NOTIFICATION SYSTEM ---
async function sendNotification(handoverId, noPolisi, issueItems) {
  console.log('--- ADMIN NOTIFICATION ---');
  console.log(`Peringatan: Kendaraan ${noPolisi} memiliki isu saat handover!`);
  console.log(`Handover ID: ${handoverId}`);
  console.log('Isu ditemukan pada item:', issueItems.map(i => i.name).join(', '));
  console.log('--------------------------');
  
  // Nodemailer test account (simulasi email)
  try {
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    let info = await transporter.sendMail({
      from: '"System Handover AMT" <system@amt.local>',
      to: "admin@amt.local",
      subject: `[PERINGATAN] Isu Handover Kendaraan ${noPolisi}`,
      text: `Kendaraan ${noPolisi} dilaporkan memiliki beberapa isu:\n${issueItems.map(i => '- ' + i.name).join('\n')}`,
    });

    console.log("Email terkirim: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Gagal mengirim email simulasi:", error);
  }
}

// --- API ROUTES ---

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
        locationLat: parseFloat(locationLat),
        locationLng: parseFloat(locationLng),
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
