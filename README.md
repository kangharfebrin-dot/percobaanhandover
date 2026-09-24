# HandoverApp - Pertamina Patra Niaga

Aplikasi Inspeksi dan Serah Terima (Handover) Truk Tangki berbasis Mobile, dirancang untuk memudahkan proses operasional, pelaporan kerusakan, dan verifikasi perbaikan truk oleh Awak Mobil Tangki (AMT) dan Pengawas.

## 🚀 Fitur Utama Saat Ini

Aplikasi telah memiliki tiga hak akses utama: **AMT (Supir)**, **Pengawas**, dan **Super Admin**.

### 1. Fitur AMT (Supir)
*   **QR Scanner**: Supir dapat memindai QR Code truk untuk langsung melakukan pengecekan kendaraan.
*   **Formulir Handover**: Checklist kondisi kendaraan (mesin, ban, lampu, dll) lengkap dengan wajib unggah foto jika ada bagian yang dilaporkan **Rusak**.
*   **Pelaporan Perbaikan (Fix Verification)**: Jika supir ditugaskan untuk memperbaiki truk, mereka wajib memfoto hasil perbaikan.
*   **Revisi Perbaikan**: Jika perbaikan ditolak oleh pengawas, supir akan menerima catatan penolakan (Alasan Penolakan) dan harus memperbaiki ulang serta mengirim kembali bukti perbaikan.

### 2. Fitur Pengawas & Super Admin
*   **Dashboard Monitoring**: Menampilkan statistik truk yang siap operasi, sedang diperbaiki, dan isu terkini.
*   **Manajemen Pengguna**: (Khusus Super Admin) Mendaftarkan dan mengelola akun AMT serta Pengawas lainnya.
*   **Daftar Isu (Issue List)**: Melihat daftar truk bermasalah secara *real-time*. Terdapat indikator jelas apakah truk *"SEDANG DIPERBAIKI"* (oleh AMT) atau *"BUTUH PERSETUJUAN"* (menunggu konfirmasi Pengawas).
*   **Evaluasi Perbaikan**: Pengawas dapat memverifikasi foto bukti perbaikan dari AMT. 
    *   ✅ **Selesai (Diterima)**: Masalah selesai.
    *   ❌ **Ditolak**: Pengawas wajib memberikan catatan (contoh: "Kaca masih terlihat retak") dan status dikembalikan ke AMT untuk diperbaiki ulang.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

*   **Frontend**: React Native (Expo), Tailwind CSS (`twrnc`), React Navigation, Axios.
*   **Backend**: Node.js, Express.js.
*   **Database & ORM**: Prisma ORM dengan database terelasi (menyimpan histori kerusakan, data pengguna, data perbaikan truk, dll).
*   **Media Handling**: Multer (Backend) & Expo Camera (Frontend).

---

## 📅 Roadmap / Apa yang Harus Dilakukan Kedepannya

Berikut adalah beberapa fitur dan optimasi yang dapat dikembangkan untuk fase selanjutnya:

1.  **Push Notification (Real-Time)**
    *   Mengintegrasikan *Expo Push Notifications* agar AMT dan Pengawas langsung menerima notifikasi di layar HP ketika ada perbaikan ditolak atau ketika ada laporan kerusakan baru.
2.  **Export Laporan (PDF / Excel)**
    *   Membuat fitur *generate report* bulanan/mingguan agar Pengawas atau Manajemen bisa mengunduh laporan kerusakan dan histori operasi truk secara resmi.
3.  **Optimasi Foto & Storage**
    *   Menambahkan kompresi gambar (contoh: `expo-image-manipulator`) pada sisi Frontend sebelum foto dikirim ke server. Hal ini untuk mencegah *storage* cepat penuh dan mempercepat proses *upload*.
4.  **Fitur Chat / Pesan Internal (Opsional)**
    *   Fitur diskusi kecil di setiap kartu *Handover* antara Pengawas dan AMT tanpa harus melalui WhatsApp pribadi.
5.  **Filter dan Search Lanjutan**
    *   Pada menu *History*, tambahkan kemampuan *filter* berdasarkan rentang tanggal (Date Range), nomor plat kendaraan, atau nama pelapor.
6.  **Keamanan & JWT Refresh Token**
    *   Memperkuat sistem otentikasi dengan token yang kedaluwarsa secara otomatis dan sistem *auto-logout* jika akun tidak aktif (Idle).
7.  **Deployment (Rilis)**
    *   Menyiapkan server *Production* untuk Backend.
    *   Mem-build aplikasi menjadi format `.apk` / `.aab` untuk dirilis atau dibagikan ke internal pekerja.

---

*Dikembangkan dengan ☕ dan dedikasi untuk mempermudah operasional logistik darat.*