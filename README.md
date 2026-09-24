# HandoverApp - Pertamina Patra Niaga

## 🎯 Tujuan Aplikasi
HandoverApp adalah aplikasi mobile inspeksi dan serah terima (handover) truk tangki yang dirancang khusus untuk mendigitalisasi proses operasional logistik darat. Aplikasi ini menggantikan pencatatan kertas manual untuk mempercepat pelaporan kerusakan, melacak riwayat kondisi fisik armada sebelum berangkat, dan memastikan standar keselamatan operasional kendaraan terpenuhi secara terpusat dan *real-time*.

## 👥 Pengguna Aplikasi
Aplikasi ini digunakan oleh 3 peran utama (Role):
1. **AMT (Awak Mobil Tangki) / Supir**: Pekerja di lapangan yang menggunakan truk. Mereka bertugas mengisi formulir inspeksi harian, melaporkan kerusakan (wajib menyertakan bukti foto), dan mengirim bukti perbaikan jika ditugaskan membenahi kerusakan tersebut.
2. **Pengawas**: Staf operasional / Supervisor yang bertugas memantau status kelayakan seluruh truk melalui dashboard. Pengawas memiliki kendali penuh untuk menyetujui (Approve) atau menolak (Reject) hasil perbaikan dari AMT.
3. **Super Admin**: Pihak manajemen atau administrator IT yang mengelola keseluruhan sistem, termasuk pendaftaran dan pengaturan akun baru untuk seluruh pekerja (Pengawas dan AMT).

## 📋 Fitur Utama yang Sudah Ada
*   **QR Code Scanner**: Pengguna memindai kode QR plat nomor kendaraan untuk langsung masuk ke formulir, mencegah salah lapor truk.
*   **Formulir Checklist Interaktif**: Sistem form pengecekan kendaraan per kategori (Ban, Mesin, Kaca, dll). Jika ada bagian yang dilaporkan **Rusak**, sistem akan mewajibkan pengguna mengambil foto bukti kerusakannya.
*   **Evaluasi Perbaikan Berlapis**: 
    *   Jika truk rusak, truk masuk ke dalam Daftar Isu.
    *   AMT yang menindaklanjuti wajib mengunggah foto perbaikan.
    *   Pengawas mengevaluasi perbaikan tersebut per bagian (*item*). Jika perbaikan belum layak, Pengawas **menolak** dan memberikan alasan (catatan penolakan). AMT akan diminta memperbaiki ulang berlandaskan catatan tersebut. Jika lulus, isu ditutup.
*   **Dashboard & Riwayat (History)**: Menampilkan rekapitulasi data armada yang layak operasi, butuh persetujuan, dan bermasalah. Selain itu, seluruh rekam jejak handover dan waktu pemeriksaannya disimpan selamanya.
*   **Multi-Role Auth**: Membedakan tampilan aplikasi (*User Interface*) dan otorisasi akses menu secara otomatis tergantung pada siapa yang *login*.

## ⚠️ Masalah / Challenge Saat Ini
1.  **Kurangnya Notifikasi Real-Time (Push Notifications)**: Pengguna belum menerima peringatan langsung pada HP mereka (pop-up notifikasi luar) jika bukti perbaikan ditolak oleh Pengawas atau jika ada laporan kerusakan mendesak yang baru masuk.
2.  **Optimasi Media (Penyimpanan Foto Membengkak)**: Aplikasi belum menerapkan kompresi / *resizing* kualitas gambar di sisi *frontend* (HP) sebelum dikirim ke server. Akibatnya, memori/hardisk server (*storage*) akan berisiko sangat cepat penuh jika aplikasi diproduksi massal.
3.  **Tidak Ada Ekspor Laporan**: Pengawas di lapangan tidak bisa mengubah riwayat kerusakan maupun *handover* ke dalam bentuk dokumen (Cetak PDF / Excel) untuk bahan rapat maupun rekapitulasi bulanan resmi.
4.  **Skalabilitas & Produksi**: Kode *backend* masih perlu dipersiapkan untuk dipublikasi (*Deployment*). Perlu pemindahan sistem database lokal (*Development*) menjadi database awan (*Production Level*) yang lebih kuat serta menerapkan keamanan tingkat tinggi pada sesi akun login pengguna (*Refresh Tokens / Auto-Logout*).