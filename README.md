# Pertamina AMT Handover App

Aplikasi ini adalah platform *handover* (serah terima) kendaraan untuk Awak Mobil Tangki (AMT) Pertamina. Aplikasi terdiri dari dua bagian utama: **Backend** (Express.js + Prisma + SQLite) dan **Frontend** (React Native Web + Expo).

## 🚀 Cara Instalasi & Menjalankan Aplikasi (Untuk Teman yang Baru Clone)

Jika kamu baru saja men-*clone* repository ini, ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara lokal di komputermu.

### 1. Setup & Jalankan Backend (API & Database)
Buka terminal baru, lalu masuk ke folder `backend`:
```bash
cd backend
```

Install semua dependencies:
```bash
npm install
```

Inisialisasi Database (SQLite) dan jalankan seeder untuk membuat akun:
```bash
npx prisma db push
node seed.js
```
*(Catatan: Langkah ini akan membuat file `dev.db` dan mengisi akun bawaan: `yoan` sebagai Admin, dan `haula` sebagai User).*

Jalankan server backend:
```bash
npm start
```
*Pastikan terminal ini dibiarkan menyala. Backend akan berjalan di `http://localhost:3000`.*

---

### 2. Setup & Jalankan Frontend (Tampilan Aplikasi/Web)
Buka terminal/CMD **kedua** (baru), lalu masuk ke folder `frontend`:
```bash
cd frontend
```

Install semua dependencies untuk frontend:
```bash
npm install
```

Jalankan aplikasi dalam mode Web:
```bash
npm run web
# atau bisa juga menggunakan perintah: npx expo start --web
```
*Pastikan terminal ini juga dibiarkan menyala.*

---

### 3. Buka Aplikasi di Browser
Setelah frontend berhasil dijalankan, buka browser kamu (Chrome/Edge/Firefox) dan akses URL berikut:
👉 **[http://localhost:8081](http://localhost:8081)**

### 🔐 Akun Login Default
- **Admin:** Username: `yoan` | Password: `969111`
- **User/AMT:** Username: `haula` | Password: `672023`
