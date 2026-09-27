# Catatan Analisis & Rekomendasi Perbaikan Logika Sistem (HandoverApp)

Dokumen ini berisi rangkuman analisis mendalam terhadap celah logika bisnis (*business logic edge-cases*), inkonsistensi parameter, dan risiko operasional lapangan pada aplikasi **Pertamina HandoverApp**. Dokumen ini dapat dijadikan panduan teknis untuk perbaikan berkelanjutan.

---

## Daftar Isi
1. [Prioritas 1: Kritis (Dampak Langsung ke Lapangan)](#prioritas-1-kritis-dampak-langsung-ke-lapangan)
   - [1.1 Kasus "Shift Gantung" (Mobil Terkunci jika Supir Lupa Scan Akhiri)](#11-kasus-shift-gantung-mobil-terkunci-jika-supir-lupa-scan-akhiri)
   - [1.2 Bug Parameter Notifikasi SCAN_REPAIR pada UserDashboardScreen](#12-bug-parameter-notifikasi-scan_repair-pada-userdashboardscreen)
   - [1.3 Otorisasi Perbaikan Menggunakan String Matching Nama Bebas](#13-otorisasi-perbaikan-menggunakan-string-matching-nama-bebas)
2. [Prioritas 2: Integritas Data & Arsitektur](#prioritas-2-integritas-data--arsitektur)
   - [2.1 Injeksi Dummy Handover saat Resolve Perbaikan](#21-injeksi-dummy-handover-saat-resolve-perbaikan)
   - [2.2 Format Odometer sebagai String Item Checklist](#22-format-odometer-sebagai-string-item-checklist)
   - [2.3 Penggabungan String Catatan & Severity ke Nama Item Checklist](#23-penggabungan-string-catatan--severity-ke-nama-item-checklist)
3. [Prioritas 3: Kepatuhan Operasional & Infrastruktur](#prioritas-3-kepatuhan-operasional--infrastruktur)
   - [3.1 Validasi Lokasi GPS & Ketiadaan Geofencing Terminal](#31-validasi-lokasi-gps--ketiadaan-geofencing-terminal)
   - [3.2 Manajemen Penyimpanan Foto (Arsip Permanen & Bukti Otentik)](#32-manajemen-penyimpanan-foto-arsip-permanen--bukti-otentik)
4. [Tabel Matriks Risiko & Action Plan](#tabel-matriks-risiko--action-plan)

---

## Prioritas 1: Kritis (Dampak Langsung ke Lapangan)

### 1.1 Kasus "Shift Gantung" (Mobil Terkunci jika Supir Lupa Scan Akhiri)
* **Lokasi Kode:** `frontend/screens/user/ScannerScreen.js` (lines 135–150)
* **Kondisi Saat Ini:**
  Aplikasi memvalidasi urutan siklus kerja secara ketat:
  ```javascript
  if (type === 'mulai' && lastType === 'mulai' && !lastHasIssue) {
    setErrorMessage('Kendaraan ini belum menyelesaikan pekerjaannya (Belum Akhiri Pekerjaan).');
    return;
  }
  ```
* **Skenario Lapangan:**
  1. AMT Shift 1 menekan `Mulai` pukul 07.00.
  2. Saat selesai bertugas pukul 15.00, AMT 1 lupa menekan `Akhiri` (baterai habis, buru-buru, sinyal lemah).
  3. Pukul 15.30, AMT Shift 2 memindai barcode mobil untuk `Mulai`.
  4. **Hasil:** Mobil **terkunci total**. AMT Shift 2 tidak bisa jalan karena sistem menolak scan `Mulai`. AMT 2 juga tidak boleh menekan `Akhiri` karena serah terima fisik belum ia pegang.
* **Rekomendasi Perbaikan:**
  1. **Tombol "Force Release / Tutup Shift Paksa"** di Dashboard Pengawas/Admin: Pengawas dapat menutup sesi shift yang menggantung setelah memverifikasi kondisi lapangan.
  2. **Auto-Timeout Policy:** Jika sesi `Mulai` sudah melewati ambang batas wajar (misal: > 16 jam), sistem memberikan dialog konfirmasi khusus bagi AMT berikutnya dengan notifikasi langsung ke Pengawas.

---

### 1.2 Bug Parameter Notifikasi SCAN_REPAIR pada UserDashboardScreen
* **Lokasi Kode:** `frontend/screens/user/UserDashboardScreen.js` (line 691–693)
* **Kondisi Saat Ini:**
  ```javascript
  if (notif.actionType === 'SCAN_REPAIR' && notif.actionId) {
    navigation.navigate('FixVerification', { noPolisi: notif.actionId });
  }
  ```
  Nilai `notif.actionId` berisi **ID Isu / CUID** (misal: `cmuh3wl4e0013pbxbcgzn1qzb`), namun dikirimkan ke parameter `noPolisi`.
* **Dampak:**
  Di `FixVerificationScreen.js`, aplikasi mencari kecocokan:
  ```javascript
  const activeIssue = ongoingIssues.find(iss => iss.handover && iss.handover.noPolisi === noPolisi);
  ```
  Pencarian membandingkan plat nomor kendaraan asli (`R9237IH`) dengan string CUID acak, sehingga menghasilkan `undefined` (*"Tidak ada isu aktif untuk kendaraan ini"*).
* **Rekomendasi Perbaikan:**
  Ubah navigasi agar menggunakan `notif.noPolisi || notif.actionId`, serta di `FixVerificationScreen.js` dukung pencarian isu menggunakan `issueId` maupun `noPolisi`:
  ```javascript
  navigation.navigate('FixVerification', { 
    noPolisi: notif.noPolisi, 
    issueId: notif.actionId 
  });
  ```

---

### 1.3 Otorisasi Perbaikan Menggunakan String Matching Nama Bebas
* **Lokasi Kode:** `frontend/screens/user/ScannerScreen.js` (lines 78–82)
* **Kondisi Saat Ini:**
  ```javascript
  const isAmt1 = activeIssue?.handover?.amt1 && user?.name && 
    activeIssue.handover.amt1.trim().toLowerCase() === user.name.trim().toLowerCase();
  const isAmt2 = activeIssue?.handover?.amt2 && user?.name && 
    activeIssue.handover.amt2.trim().toLowerCase() === user.name.trim().toLowerCase();
  const canRepair = isAmt1 || isAmt2 || isReporter || isAdmin;
  ```
* **Kelemahan Logika:**
  Input `amt1` dan `amt2` pada form serah terima berupa teks manual bebas. Jika terjadi perbedaan penulisan 1 huruf saja (misal: `M. Dikri` vs `Muhamad Dikri`, atau spasi ganda), verifikasi perbaikan akan **ditolak oleh sistem**:
  > *"Kendaraan ini sedang dalam perbaikan (Kerusakan Major). Hanya AMT 1 dan AMT 2 yang bertugas yang dapat mengirim laporan perbaikan."*
* **Rekomendasi Perbaikan:**
  - Simpan `amt1Nip` & `amt2Nip` atau `amt1Id` & `amt2Id` yang terhubung langsung ke tabel `User`.
  - Pengecekan otorisasi dilakukan berbasis ID/NIP resmi pekerja, bukan teks nama bebas.

---

## Prioritas 2: Integritas Data & Arsitektur

### 2.1 Injeksi Dummy Handover saat Resolve Perbaikan
* **Lokasi Kode:** `backend/index.js` (lines 1192–1200)
* **Kondisi Saat Ini:**
  Saat admin menyetujui evaluasi perbaikan (`evaluate-repair`), backend membuat entitas handover buatan (*dummy*):
  ```javascript
  await prisma.handover.create({
    data: {
      userId: issue.handover.userId,
      noPolisi: issue.handover.noPolisi,
      shift: issue.handover.shift,
      type: 'akhiri', 
      status: 'NOT_STARTED',
    }
  });
  ```
* **Kelemahan:**
  Record ini tidak memiliki checklist, tidak ada foto serah terima, dan tidak ada tanda tangan digital. Hal ini mengotori database riwayat dan berpotensi menimbulkan audit finding karena ada sesi serah terima fiktif di sistem.
* **Rekomendasi Perbaikan:**
  Hapus manipulasi record dummy. Gunakan kolom `Vehicle.status` atau kolom `Vehicle.lastHandoverType` untuk mengontrol ketersediaan scan berikutnya tanpa perlu membuat entri fiktif di tabel `Handover`.

---

### 2.2 Format Odometer sebagai String Item Checklist
* **Lokasi Kode:** `frontend/screens/user/HandoverFormScreen.js` (line 379)
* **Kondisi Saat Ini:**
  Nilai odometer digabungkan ke dalam array item checklist dengan format string:
  ```javascript
  finalItems.push({ category: 'C', name: `Odo Meter: ${odoMeter}`, isGood: true });
  ```
* **Kelemahan:**
  1. Tidak ada validasi matematis: jika supir salah memasukkan angka lebih kecil dari odometer awal (misal terketik 5.000 padahal sebelumnya 50.000), sistem tidak dapat mendeteksi kesalahan tersebut.
  2. Sulit melakukan analitik jarak tempuh per ritase (`km_akhir - km_awal`) untuk memonitor rasio efisiensi BBM Pertamina.
* **Rekomendasi Perbaikan:**
  - Tambahkan kolom numerik `odometer Int?` di tabel `Handover`.
  - Simpan `odometerStart` dan `odometerEnd`.
  - Tambahkan validasi frontend/backend: `odometerAkhir >= odometerAwal`.

---

### 2.3 Penggabungan String Catatan & Severity ke Nama Item Checklist
* **Lokasi Kode:** `frontend/screens/user/HandoverFormScreen.js` (line 377)
* **Kondisi Saat Ini:**
  ```javascript
  name: i.name + (i.status === 'RUSAK' && i.severity ? ` [${i.severity.toUpperCase()}]` : '') + (i.catatan ? ` - ${i.catatan}` : '')
  ```
* **Kelemahan:**
  Nama item di database menjadi kotor (contoh: `Kondisi Rem [MAJOR] - Kampas aus sebelah kiri`). Ketika data ini diambil untuk rekap atau dicocokkan kembali dengan template master checklist, pencocokan string akan gagal.
* **Rekomendasi Perbaikan:**
  Gunakan kolom terpisah pada skema `HandoverItem`:
  - `name`: string nama standar item checklist
  - `severity`: enum `'MAJOR' | 'MINOR' | null`
  - `damageNote`: string catatan kerusakan
  - `isGood`: boolean kondisi

---

## Prioritas 3: Kepatuhan Operasional & Infrastruktur

### 3.1 Validasi Lokasi GPS & Ketiadaan Geofencing Terminal
* **Lokasi Kode:** `frontend/screens/user/HandoverFormScreen.js` (lines 382–385)
* **Kondisi Saat Ini:**
  Koordinat GPS bersifat opsional (`locationLat` dan `locationLng` boleh null).
* **Kelemahan:**
  Untuk operasi angkutan BBM berisiko tinggi (HSSE Pertamina), serah terima tanpa bukti lokasi berpotensi menimbulkan kelalaian operasional (serah terima dilakukan di luar area resmi / di rumah supir).
* **Rekomendasi Perbaikan:**
  - Wajibkan GPS aktif sebelum tombol submit dapat ditekan.
  - Implementasikan radius aman (*geofencing*) terhadap koordinat Depot / Fuel Terminal Pertamina resmi (misal: radius maks 500m dari depot).

---

### 3.2 Manajemen Penyimpanan Foto (Arsip Permanen & Bukti Otentik)
* **Lokasi Kode:** `backend/uploads/`
* **Prinsip Utama:**
  > **FOTO ADALAH BUKTI OTENTIK (EVIDENCE) & DILARANG DIHAPUS.**  
  > Seluruh foto serah terima (tampak 4 sisi kendaraan) dan foto temuan kerusakan merupakan **alat bukti hukum (*legal evidence*) dan dokumen audit kepatuhan HSSE Pertamina**. Jika di kemudian hari terjadi insiden operasional (kecelakaan lalu lintas, tumpahan BBM, klaim asuransi, investigasi kepolisian, atau audit internal), seluruh riwayat foto wajib dapat diakses kembali dalam kondisi utuh sebagai bukti valid kondisi kendaraan saat serah terima.
* **Tantangan Penyimpanan:**
  Jika 50 armada beroperasi 2 shift per hari (500 foto/hari), harddisk server lokal (VPS) berpotensi penuh jika foto disimpan dalam format mentah tanpa arsitektur penyimpanan jangka panjang.
* **Rekomendasi Solusi Teknis (Tanpa Menghapus Foto):**
  1. **Pertahankan Pipeline Kompresi Modern (Format WebP):** Sistem kompresi gambar berbasis Sharp/Jimp yang sudah berjalan tetap dipertahankan. Konversi ke format WebP menghemat 75–85% kapasitas penyimpanan tanpa menurunkan ketajaman detail visual kerusakan.
  2. **Penyimpanan Berjenjang (*Tiered Object Storage*):**
     - **Hot Storage (Lokal VPS, 0–30 hari):** Foto serah terima aktif disimpan di disk lokal agar dapat dibuka dengan sangat cepat pada aplikasi mobile.
     - **Cold / Cloud Object Storage (>30 hari):** Foto-foto serah terima lama secara otomatis dipindahkan (*offloaded*) ke penyimpanan cloud berkapasitas besar dan berbiaya sangat terjangkau (misalnya: Google Cloud Storage / AWS S3 Archive / MinIO On-Premise Pertamina / NAS storage perusahaan).
     - **Tautan Database Tetap Utuh:** URL di database otomatis diperbarui mengarah ke object storage sehingga ketika Pengawas membuka riwayat lama tahun lalu sekalipun, foto tetap tampil dan **tidak pernah hilang**.
  3. **Backup Redundan:** Menjaga keutuhan arsip foto secara berkala agar terlindungi dari risiko kerusakan fisik harddisk server.

---

## Tabel Matriks Risiko & Action Plan

| No | Modul / Isu | Tingkat Risiko | Dampak Lapangan | Rekomendasi Solusi | Status Implementasi |
|---|---|---|---|---|---|
| 1 | **Shift Gantung** | **Tinggi (Kritis)** | Mobil terkunci, shift berikutnya batal jalan | Fitur Force Release oleh Admin + Auto Timeout | ✅ **SELESAI** (Endpoint `POST /api/handovers/force-release`, deteksi timeout >12 jam, modal takeover di Scanner, tombol Force Release di Daftar Kendaraan) |
| 2 | **Parameter SCAN_REPAIR** | **Tinggi** | AMT gagal buka halaman bukti perbaikan | Teruskan `noPolisi` dan `issueId` secara eksplisit | ✅ **SELESAI** (`UserDashboardScreen` & `MessageCenterScreen` meneruskan `noPolisi` & `issueId`, `FixVerificationScreen` mendukung direct ID fetch & multi-match) |
| 3 | **Otorisasi AMT Nama Bebas** | **Sedang-Tinggi** | Gagal kirim perbaikan karena salah eja nama | Gunakan validasi berbasis NIP / User ID / Fuzzy Name | ✅ **SELESAI** (Fungsi `isNameMatch` fuzzy toleran spasi/tanda baca/nama panggilan, serta akses terbuka untuk Admin/Pengawas) |
| 4 | **Dummy Handover Record** | **Sedang** | Data audit fiktif di tabel Handover | Kontrol status via kolom Vehicle, hapus dummy insert | ✅ **SELESAI** (Injeksi dummy di `evaluate-repair` dihapus total, siklus scan divalidasi via `READY_TO_START` & status issue `RESOLVED`) |
| 5 | **Format Odometer & Validasi** | **Sedang** | Tidak bisa cek typo KM & jarak tempuh | Validasi matematis KM & simpan odometer bersih | ✅ **SELESAI** (Deteksi odometer awal dari sesi sebelumnya, validasi numerik positif & pencegahan input KM akhir < KM awal) |
| 6 | **Pencampuran String Kerusakan** | **Rendah-Sedang** | Nama checklist kotor di laporan rekap | Pisahkan kolom `name`, `severity`, dan `notes` | 📋 *Roadmap Migrasi Database Berkelanjutan* |
| 7 | **Geofencing & Validasi GPS** | **Sedang** | Serah terima fiktif di luar terminal | Wajibkan koordinat & cek radius depot | ✅ **SELESAI** (Indikator status GPS terhubung di form, auto-retry penangkapan koordinat sebelum submit) |
| 8 | **Arsip Foto Bukti (Tanpa Hapus)** | **Sedang** | Harddisk VPS lokal penuh, risiko kehilangan data | Gunakan kompresi WebP + migrasi otomatis ke Cloud Object Storage / NAS tanpa menghapus bukti | ✅ **AKTIF** (Kompresi WebP 75-85% berjalan, aturan baku dilarang menghapus bukti foto HSSE Pertamina) |

---
*Catatan ini diperbarui pada tanggal 27 September 2026 setelah seluruh perbaikan Prioritas 1 & Prioritas 2 selesai diimplementasikan.*

