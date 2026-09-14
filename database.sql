-- STRUKTUR DATABASE (SQL) UNTUK APLIKASI HANDOVER AMT PERTAMINA

-- 1. TABEL PENGGUNA (MENYIMPAN DATA ADMIN DAN SUPIR)
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL, -- Contoh isi: 'ADMIN' atau 'USER'
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL
);

-- 2. TABEL UTAMA LAPORAN HANDOVER (MENYIMPAN DATA UMUM TRUK)
CREATE TABLE `Handover` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `noPolisi` VARCHAR(191) NOT NULL,
  `shift` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL, -- Contoh isi: 'Siap Operasi (Normal)' atau 'Ada Masalah'
  `locationLat` DOUBLE NULL, -- Kordinat GPS
  `locationLng` DOUBLE NULL, -- Kordinat GPS
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` VARCHAR(191) NOT NULL, -- Relasi ke Supir yang mensubmit
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. TABEL DETAIL DAFTAR ALAT (MENYIMPAN CHECKLIST BAIK/RUSAK)
CREATE TABLE `HandoverItem` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `category` VARCHAR(191) NOT NULL, -- Contoh isi: 'A' (Truk) atau 'B' (Seragam)
  `name` VARCHAR(191) NOT NULL, -- Nama alat: 'Kondisi Rem', 'Wiper', dll
  `isGood` BOOLEAN NOT NULL, -- TRUE jika Baik/Ada, FALSE jika Rusak/Tidak Ada
  `handoverId` VARCHAR(191) NOT NULL, -- Relasi ke Laporan Handover
  FOREIGN KEY (`handoverId`) REFERENCES `Handover`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. TABEL FOTO (MENYIMPAN 4 SISI FOTO BUKTI)
CREATE TABLE `Photo` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `type` VARCHAR(191) NOT NULL, -- 'Depan', 'Belakang', 'Kanan', 'Kiri'
  `url` VARCHAR(191) NOT NULL, -- Lokasi file foto tersimpan di server
  `handoverId` VARCHAR(191) NOT NULL,
  FOREIGN KEY (`handoverId`) REFERENCES `Handover`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================================
-- CONTOH INSERT DATA (CARA MENGISI DATANYA KE SQL)
-- ========================================================

-- Contoh Insert Supir
INSERT INTO `User` (`id`, `username`, `password`, `role`, `name`, `updatedAt`) 
VALUES ('1', 'haula', '672023', 'USER', 'Haula', CURRENT_TIMESTAMP);

-- Contoh Insert Laporan
INSERT INTO `Handover` (`id`, `noPolisi`, `shift`, `status`, `userId`, `updatedAt`)
VALUES ('h1', 'B 1234 XYZ', 'Shift 1', 'Ada Masalah', '1', CURRENT_TIMESTAMP);

-- Contoh Insert Checklist
INSERT INTO `HandoverItem` (`id`, `category`, `name`, `isGood`, `handoverId`)
VALUES 
('item1', 'A', 'Kondisi Rem', TRUE, 'h1'),
('item2', 'A', 'Kondisi Ban', FALSE, 'h1');

-- Contoh Insert Foto
INSERT INTO `Photo` (`id`, `type`, `url`, `handoverId`)
VALUES 
('photo1', 'Depan', '/uploads/foto_depan_123.jpg', 'h1'),
('photo2', 'Belakang', '/uploads/foto_belakang_123.jpg', 'h1');
