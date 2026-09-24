-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 24, 2026 at 08:37 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `handover_pertamina`
--

-- --------------------------------------------------------

--
-- Table structure for table `checklistitem`
--

CREATE TABLE `checklistitem` (
  `id` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `severity` varchar(191) NOT NULL DEFAULT 'Minor',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `checklistitem`
--

INSERT INTO `checklistitem` (`id`, `category`, `name`, `severity`, `createdAt`, `updatedAt`) VALUES
('227f6e3c-751e-4709-a1a7-56963ab6e2f8', 'A', 'Kondisi Rem', 'Major', '2026-09-22 06:42:54.452', '2026-09-22 06:42:54.452'),
('f31a6bf3-5ba7-45b4-95d4-2c7a8c705806', 'A', 'Kondisi Wiper', 'Minor', '2026-09-22 06:42:54.457', '2026-09-22 06:42:54.457'),
('50336ad6-6360-4651-aea7-577680e41923', 'A', 'Kondisi Kompartemen Tangki', 'Major', '2026-09-22 06:42:54.458', '2026-09-22 06:42:54.458'),
('4e19bdb4-e78c-4f9b-8b34-3869943d7faf', 'A', 'Keberadaan DCP/ CO2', 'Major', '2026-09-22 06:42:54.460', '2026-09-22 06:42:54.460'),
('f99d2bd0-4141-4332-a317-700723455a9a', 'A', 'Oli Mesin', 'Major', '2026-09-22 06:42:54.461', '2026-09-22 06:42:54.461'),
('3715402c-fb44-4454-a1ca-83df6c7f0fa4', 'A', 'Air Radiator', 'Minor', '2026-09-22 06:42:54.463', '2026-09-22 06:42:54.463'),
('b9e2ff5b-0051-4d8a-8d7b-a0c8875d2501', 'A', 'Keberadaan STNK', 'Major', '2026-09-22 06:42:54.465', '2026-09-22 06:42:54.465'),
('aa6a0a0b-ff05-4ce0-adb6-e96a7647f42b', 'A', 'Keberadaan Surat Keur', 'Major', '2026-09-22 06:42:54.466', '2026-09-22 06:42:54.466'),
('ef33ec7d-3f6c-42f2-858e-e08fd21e8406', 'A', 'Keberadaan Surat Tera', 'Major', '2026-09-22 06:42:54.468', '2026-09-22 06:42:54.468'),
('95cba582-80d5-4865-a923-11f24e50a858', 'A', 'Keberadaan Kotak P3K', 'Minor', '2026-09-22 06:42:54.469', '2026-09-22 06:42:54.469'),
('3ce0e3a3-288b-4f05-b9a7-64741e86ec42', 'A', 'Keberadaan Flame Trap', 'Major', '2026-09-22 06:42:54.471', '2026-09-22 06:42:54.471'),
('071eaed1-e21f-4bb4-906e-c050e10f79c5', 'A', 'Keberadaan Tools Kit termasuk dongkrak', 'Minor', '2026-09-22 06:42:54.472', '2026-09-22 06:42:54.472'),
('fc22cc82-452b-489a-8e5e-e44b1c08e2db', 'A', 'Keberadaan Selang bongkar', 'Major', '2026-09-22 06:42:54.473', '2026-09-22 06:42:54.473'),
('a408a297-da4c-4958-b6c9-26f25f1d8262', 'A', 'Keberadaan Grounding Cable', 'Major', '2026-09-22 06:42:54.474', '2026-09-22 06:42:54.474'),
('fb7db098-7b39-4145-9f2e-bd6a93d06733', 'A', 'Keberadaan Spill Kit', 'Minor', '2026-09-22 06:42:54.475', '2026-09-22 06:42:54.475'),
('0003c092-6589-48d4-a183-dc88a7279536', 'B', 'Membawa SIM Sesuai Kendaraan', 'Major', '2026-09-22 06:42:54.476', '2026-09-22 06:42:54.476'),
('f7b2e29e-4012-4ef7-b2b7-e555cd3c937a', 'B', 'ID/ HSE Paspor Berlaku', 'Major', '2026-09-22 06:42:54.478', '2026-09-22 06:42:54.478'),
('8cc0f418-7fb3-4eaa-bd0c-3e5a36c0077d', 'B', 'Dokumen KIM', 'Major', '2026-09-22 06:42:54.479', '2026-09-22 06:42:54.479'),
('b353e8b2-82d7-4eac-ad36-0faba7b0b9c3', 'B', 'Menggunakan Seragam Kerja', 'Minor', '2026-09-22 06:42:54.480', '2026-09-22 06:42:54.480'),
('63c5eb1a-b97f-425d-aeab-1a92680bc818', 'B', 'Menggunakan Safety Shoes', 'Major', '2026-09-22 06:42:54.482', '2026-09-22 06:42:54.482'),
('8cfd9d94-e865-4dd5-b1f3-a529bc778950', 'B', 'Menggunakan Safety Helm', 'Major', '2026-09-22 06:42:54.483', '2026-09-22 06:42:54.483'),
('1d38aa57-00a2-4498-b5a8-07c9e90ee0a2', 'B', 'Menggunakan Safety Glove', 'Minor', '2026-09-22 06:42:54.484', '2026-09-22 06:42:54.484'),
('fb9335ca-9a3f-44e1-bb30-ffee3f474919', 'B', 'Membawa Jas Hujan', 'Minor', '2026-09-22 06:42:54.485', '2026-09-22 06:42:54.485'),
('df367373-a52c-4f51-82ec-c8252d7f0bb4', 'B', 'Membawa Buku Saku AMT', 'Minor', '2026-09-22 06:42:54.486', '2026-09-22 06:42:54.486');

-- --------------------------------------------------------

--
-- Table structure for table `handover`
--

CREATE TABLE `handover` (
  `id` varchar(191) NOT NULL,
  `noPolisi` varchar(191) NOT NULL,
  `shift` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `locationLat` double DEFAULT NULL,
  `locationLng` double DEFAULT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `handover`
--

INSERT INTO `handover` (`id`, `noPolisi`, `shift`, `status`, `locationLat`, `locationLng`, `timestamp`, `userId`, `createdAt`, `updatedAt`) VALUES
('cmuduu1ib0001mgpig9lgheg8', 'AA8860OF', '08:00', 'Ada Masalah', -7.6187567, 109.1441678, '2026-09-23 08:42:10.595', 'cmudheyu7000jofxrs198uizm', '2026-09-23 08:42:10.595', '2026-09-23 08:42:10.595'),
('cmuduudbr000xmgpixc74sljy', 'AA8410OP', '08:00', 'Siap Operasi (Normal)', -7.6187612, 109.1441696, '2026-09-23 08:42:25.911', 'cmudhez1f000mofxrg9mnwqq1', '2026-09-23 08:42:25.911', '2026-09-23 08:42:25.911'),
('cmudv3p34001smgpio0styucp', 'AA8860OF', '08:00', 'Ada Masalah', -7.6187567, 109.1441678, '2026-09-23 08:49:41.056', 'cmudheyu7000jofxrs198uizm', '2026-09-23 08:49:41.056', '2026-09-23 08:49:41.056');

-- --------------------------------------------------------

--
-- Table structure for table `handoveritem`
--

CREATE TABLE `handoveritem` (
  `id` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `isGood` tinyint(1) NOT NULL,
  `handoverId` varchar(191) NOT NULL,
  `isRepaired` tinyint(1) NOT NULL DEFAULT 0,
  `repairNote` varchar(191) DEFAULT NULL,
  `repairPhotoUrl` varchar(191) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `handoveritem`
--

INSERT INTO `handoveritem` (`id`, `category`, `name`, `isGood`, `handoverId`, `isRepaired`, `repairNote`, `repairPhotoUrl`) VALUES
('cmuduu1ic0002mgpie21qyo8h', 'A', 'Kondisi Rem', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0003mgpiloelo0dz', 'A', 'Kondisi Wiper [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0004mgpi8oqtbrq9', 'A', 'Kondisi Kompartemen Tangki [MINOR] - Haula', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0005mgpisgoo9qos', 'A', 'Keberadaan DCP/ CO2 [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0006mgpicg0k6mv4', 'A', 'Oli Mesin', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0007mgpiwxl1mujp', 'A', 'Air Radiator [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0008mgpiihh1iy8p', 'A', 'Keberadaan STNK [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic0009mgpid9rtncsd', 'A', 'Keberadaan Surat Keur', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000amgpib27q602l', 'A', 'Keberadaan Surat Tera [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000bmgpiiury552i', 'A', 'Keberadaan Kotak P3K [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000cmgpiaiikegz4', 'A', 'Keberadaan Flame Trap', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000dmgpizgsf50zp', 'A', 'Keberadaan Tools Kit termasuk dongkrak [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000emgpi4alz8m3b', 'A', 'Keberadaan Selang bongkar [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000fmgpivltgte28', 'A', 'Keberadaan Grounding Cable', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000gmgpix4wksnxm', 'A', 'Keberadaan Spill Kit [MINOR]', 0, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000hmgpi4fg7lkxv', 'B', 'Membawa SIM Sesuai Kendaraan', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000imgpisghy7vgj', 'B', 'ID/ HSE Paspor Berlaku', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000jmgpi4sdb9z3d', 'B', 'Dokumen KIM', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000kmgpiyns7nezm', 'B', 'Menggunakan Seragam Kerja', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000lmgpi93vnter9', 'B', 'Menggunakan Safety Shoes', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000mmgpi2ncyp71n', 'B', 'Menggunakan Safety Helm', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000nmgpie6dj78im', 'B', 'Menggunakan Safety Glove', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000omgpigvsugbni', 'B', 'Membawa Jas Hujan', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000pmgpiklxm8xzi', 'B', 'Membawa Buku Saku AMT', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduu1ic000qmgpie7l6n79q', 'C', 'Odo Meter: 2000', 1, 'cmuduu1ib0001mgpig9lgheg8', 0, NULL, NULL),
('cmuduudbs000ymgpijn9w8obd', 'A', 'Kondisi Rem', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs000zmgpibxus7gnr', 'A', 'Kondisi Wiper', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0010mgpilcvc2xuw', 'A', 'Kondisi Kompartemen Tangki', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0011mgpimvjvzrmc', 'A', 'Keberadaan DCP/ CO2', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0012mgpi183lzd5c', 'A', 'Oli Mesin', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0013mgpihs3nn8z9', 'A', 'Air Radiator', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0014mgpi8h7g0sco', 'A', 'Keberadaan STNK', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0015mgpiywy3i38d', 'A', 'Keberadaan Surat Keur', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0016mgpivu8zbogt', 'A', 'Keberadaan Surat Tera', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0017mgpiqvn5n0sj', 'A', 'Keberadaan Kotak P3K', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0018mgpi0xgmpsnd', 'A', 'Keberadaan Flame Trap', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs0019mgpixar8qvsp', 'A', 'Keberadaan Tools Kit termasuk dongkrak', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001amgpi3u1xdhsq', 'A', 'Keberadaan Selang bongkar', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001bmgpijeuc2869', 'A', 'Keberadaan Grounding Cable', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001cmgpiye4a2zio', 'A', 'Keberadaan Spill Kit', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001dmgpiho92j1b0', 'B', 'Membawa SIM Sesuai Kendaraan', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001emgpidj7e28m5', 'B', 'ID/ HSE Paspor Berlaku', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001fmgpi9rpwp5n9', 'B', 'Dokumen KIM', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001gmgpic5uyy6z8', 'B', 'Menggunakan Seragam Kerja', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001hmgpiijh9a3zb', 'B', 'Menggunakan Safety Shoes', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001imgpiol0anykc', 'B', 'Menggunakan Safety Helm', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001jmgpigbyxb68f', 'B', 'Menggunakan Safety Glove', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001kmgpia67c8mfw', 'B', 'Membawa Jas Hujan', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001lmgpirjv8868l', 'B', 'Membawa Buku Saku AMT', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmuduudbs001mmgpijfiocnb9', 'C', 'Odo Meter: 100', 1, 'cmuduudbr000xmgpixc74sljy', 0, NULL, NULL),
('cmudv3p34001tmgpi3q67gi51', 'A', 'Kondisi Rem', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001umgpihyetkchr', 'A', 'Kondisi Wiper [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001vmgpishqk4kb4', 'A', 'Kondisi Kompartemen Tangki [MINOR] - Haula', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001wmgpiztr56q1c', 'A', 'Keberadaan DCP/ CO2 [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001xmgpi64yfndbg', 'A', 'Oli Mesin', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001ymgpir6ellxh8', 'A', 'Air Radiator [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p34001zmgpiqg5k6hqa', 'A', 'Keberadaan STNK [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340020mgpi9pat1ba2', 'A', 'Keberadaan Surat Keur', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340021mgpi5l0yxq1v', 'A', 'Keberadaan Surat Tera [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340022mgpidpml2bku', 'A', 'Keberadaan Kotak P3K [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340023mgpij77989pq', 'A', 'Keberadaan Flame Trap', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340024mgpiwie3kaip', 'A', 'Keberadaan Tools Kit termasuk dongkrak [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340025mgpigqpski3x', 'A', 'Keberadaan Selang bongkar [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340026mgpixu0etmj8', 'A', 'Keberadaan Grounding Cable', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340027mgpit271zbyi', 'A', 'Keberadaan Spill Kit [MINOR]', 0, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p340028mgpiz6rrjn91', 'B', 'Membawa SIM Sesuai Kendaraan', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p350029mgpiefffkrhx', 'B', 'ID/ HSE Paspor Berlaku', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002amgpimtjuq515', 'B', 'Dokumen KIM', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002bmgpi4g5y1mea', 'B', 'Menggunakan Seragam Kerja', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002cmgpi7gfa9zd2', 'B', 'Menggunakan Safety Shoes', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002dmgpip18spgel', 'B', 'Menggunakan Safety Helm', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002emgpiw82ep1sk', 'B', 'Menggunakan Safety Glove', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002fmgpion19w2yo', 'B', 'Membawa Jas Hujan', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002gmgpitzxl3u8e', 'B', 'Membawa Buku Saku AMT', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL),
('cmudv3p35002hmgpir0np3c2t', 'C', 'Odo Meter: 2000', 1, 'cmudv3p34001smgpio0styucp', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `issue`
--

CREATE TABLE `issue` (
  `id` varchar(191) NOT NULL,
  `handoverId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ONGOING',
  `resolvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `repairRequestedAt` datetime(3) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `issue`
--

INSERT INTO `issue` (`id`, `handoverId`, `status`, `resolvedAt`, `createdAt`, `updatedAt`, `repairRequestedAt`) VALUES
('cmuduu1id000vmgpicwvwkwj4', 'cmuduu1ib0001mgpig9lgheg8', 'ONGOING', NULL, '2026-09-23 08:42:10.595', '2026-09-23 08:42:10.595', NULL),
('cmudv3p35002mmgpixkwzwfn8', 'cmudv3p34001smgpio0styucp', 'ONGOING', NULL, '2026-09-23 08:49:41.056', '2026-09-23 08:49:41.056', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `photo`
--

CREATE TABLE `photo` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `url` varchar(191) NOT NULL,
  `handoverId` varchar(191) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `photo`
--

INSERT INTO `photo` (`id`, `type`, `url`, `handoverId`) VALUES
('cmuduu1id000rmgpihn4io7mb', 'TERLAMPIR', 'uploads/3f845052eb37f51f79eda1591d5afedb', 'cmuduu1ib0001mgpig9lgheg8'),
('cmuduu1id000smgpirvt3bw4n', 'TERLAMPIR', 'uploads/6d4fb80c87b30f3c492d5525bc06fdbc', 'cmuduu1ib0001mgpig9lgheg8'),
('cmuduu1id000tmgpis5n37hg7', 'TERLAMPIR', 'uploads/41c46faebe9ede27e2d407274e8f58b9', 'cmuduu1ib0001mgpig9lgheg8'),
('cmuduu1id000umgpi3as0osvn', 'TERLAMPIR', 'uploads/233e8010c6c89d117b61e7b31608ac14', 'cmuduu1ib0001mgpig9lgheg8'),
('cmuduudbs001nmgpidp2bx4jg', 'TERLAMPIR', 'uploads/8aca8269742f66c156c2e365f3d76ebc', 'cmuduudbr000xmgpixc74sljy'),
('cmuduudbs001omgpiey8j9guq', 'TERLAMPIR', 'uploads/25634a445b3476f09fd5b4fe0f1af2b0', 'cmuduudbr000xmgpixc74sljy'),
('cmuduudbs001pmgpi8ly697x6', 'TERLAMPIR', 'uploads/f84fa5d79a66a54477abe7492205f7c6', 'cmuduudbr000xmgpixc74sljy'),
('cmuduudbs001qmgpiqt6p18kh', 'TERLAMPIR', 'uploads/298d1b3d7e2e37236e8b2288f5d1bd91', 'cmuduudbr000xmgpixc74sljy'),
('cmudv3p35002imgpiszu8kkjy', 'TERLAMPIR', 'uploads/4fe0dd5288705694fb347fa07dd1e5f5', 'cmudv3p34001smgpio0styucp'),
('cmudv3p35002jmgpifcl0bk6s', 'TERLAMPIR', 'uploads/edeb8ac0b268b5a83f0f368cc1aa618e', 'cmudv3p34001smgpio0styucp'),
('cmudv3p35002kmgpidg6k1pc8', 'TERLAMPIR', 'uploads/d2120edaf53afcf4a2e712fdb989626f', 'cmudv3p34001smgpio0styucp'),
('cmudv3p35002lmgpirtix8h3p', 'TERLAMPIR', 'uploads/5ced3470141e67a71cb657c1b1b0f2f6', 'cmudv3p34001smgpio0styucp');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `jabatan` varchar(191) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `password`, `role`, `name`, `createdAt`, `updatedAt`, `jabatan`) VALUES
('656f7ecd-fa96-48d2-b318-cdab28becd78', 'yoan', '$2b$10$P4BNY2q6BdA6qgyQKUeS/u/gm/s6mmCqgPQM0io9ew5Ezoq6JXZ5C', 'SUPER_ADMIN', 'Yoann', '2026-09-17 07:53:55.619', '2026-09-23 07:04:19.202', NULL),
('cmudhexmw0001ofxr5vy56gnr', '617.05.0007', '617.05.0007', 'AMT', 'AGUS BUDIARTO', '2026-09-23 02:26:30.729', '2026-09-23 03:36:17.291', 'AMT II'),
('c580a66c-0de3-4360-904d-85a67bc95175', 'haula', 'haula123', 'PENGAWAS', 'HaUllA ', '2026-09-21 08:07:21.589', '2026-09-23 07:04:19.257', NULL),
('cmudhexkb0000ofxrbxo2wh1z', '617.05.0003', '617.05.0003', 'AMT', 'ADES SETIAWAN', '2026-09-23 02:26:30.635', '2026-09-23 03:36:17.295', 'AMT I'),
('cmudhexpd0002ofxrmvllaw56', '617.05.0009', '617.05.0009', 'AMT', 'AGUS PARTONO', '2026-09-23 02:26:30.817', '2026-09-23 03:36:17.297', 'AMT I'),
('cmudhexrs0003ofxrgf8sw7od', '617.05.0010', '617.05.0010', 'AMT', 'AGUS SAPTO ARI WIBOWO', '2026-09-23 02:26:30.904', '2026-09-23 03:36:17.299', 'AMT II'),
('cmudhexu70004ofxrc6nfh0we', '617.05.0017', '617.05.0017', 'AMT', 'ANDRI', '2026-09-23 02:26:30.991', '2026-09-23 03:36:17.301', 'AMT I'),
('cmudhexwk0005ofxrxa8i4ajx', '617.05.0034', '617.05.0034', 'AMT', 'BUDI ISWANTO', '2026-09-23 02:26:31.077', '2026-09-23 03:36:17.303', 'AMT I'),
('cmudhexyx0006ofxrwqv56izj', '617.05.0037', '617.05.0037', 'AMT', 'CHABIBI YASIN', '2026-09-23 02:26:31.162', '2026-09-23 03:36:17.305', 'AMT I'),
('cmudhey1b0007ofxrzr62x2bw', '617.05.0038', '617.05.0038', 'AMT', 'CHAMIM ARI TRI WIBOWO', '2026-09-23 02:26:31.248', '2026-09-23 03:36:17.307', 'AMT I'),
('cmudhey3q0008ofxr30sg3s1x', '617.05.0044', '617.05.0044', 'AMT', 'DARYONO', '2026-09-23 02:26:31.334', '2026-09-23 03:36:17.309', 'AMT I'),
('cmudhey630009ofxr1mmurjtw', '617.05.0047', '617.05.0047', 'AMT', 'DEDI SANTOSO', '2026-09-23 02:26:31.420', '2026-09-23 03:36:17.311', 'AMT I'),
('cmudhey8h000aofxr2u3bebdm', '617.05.0052', '617.05.0052', 'AMT', 'DWI RIYANTO', '2026-09-23 02:26:31.506', '2026-09-23 03:36:17.313', 'AMT I'),
('cmudheyav000bofxriyq3g3e5', '617.05.0054', '617.05.0054', 'AMT', 'EDI SURYANTO', '2026-09-23 02:26:31.591', '2026-09-23 03:36:17.315', 'AMT I'),
('cmudheydd000cofxrmhe31iyy', '617.05.0055', '617.05.0055', 'AMT', 'EDWI ARI AZIZ', '2026-09-23 02:26:31.681', '2026-09-23 03:36:17.317', 'AMT I'),
('cmudheyft000dofxrk14tzpii', '617.05.0056', '617.05.0056', 'AMT', 'EKO FAJAR RAYZAL', '2026-09-23 02:26:31.769', '2026-09-23 03:36:17.319', 'AMT I'),
('cmudheyi7000eofxrq5yl9gf7', '617.05.0058', '617.05.0058', 'AMT', 'EKO SUPARDIANTO', '2026-09-23 02:26:31.855', '2026-09-23 03:36:17.321', 'AMT I'),
('cmudheykk000fofxrsbiggsr5', '617.05.0059', '617.05.0059', 'AMT', 'EKO SUSANTO', '2026-09-23 02:26:31.941', '2026-09-23 03:36:17.322', 'AMT I'),
('cmudheymy000gofxrp2worliq', '617.05.0060', '617.05.0060', 'AMT', 'EKO WAHYONO', '2026-09-23 02:26:32.027', '2026-09-23 03:36:17.324', 'AMT II'),
('cmudheype000hofxrbpve7238', '617.05.0063', '617.05.0063', 'AMT', 'FEBRIANT WAHAB NOOR', '2026-09-23 02:26:32.114', '2026-09-23 03:36:17.325', 'AMT II'),
('cmudheyrs000iofxrt2bx2f27', '617.05.0064', '617.05.0064', 'AMT', 'FIQIH ANSYORI', '2026-09-23 02:26:32.200', '2026-09-23 03:36:17.327', 'AMT I'),
('cmudheyu7000jofxrs198uizm', '617.05.0068', '617.05.0068', 'AMT', 'GINANJAR AGUNG SABANI', '2026-09-23 02:26:32.287', '2026-09-23 03:36:17.329', 'AMT I'),
('cmudheywl000kofxr90zionnk', '617.05.0070', '617.05.0070', 'AMT', 'HANDI ISWANTO', '2026-09-23 02:26:32.374', '2026-09-23 03:36:17.332', 'AMT I'),
('cmudheyz1000lofxrynm9nf2x', '617.05.0072', '617.05.0072', 'AMT', 'HARTONO', '2026-09-23 02:26:32.461', '2026-09-23 03:36:17.333', 'AMT I'),
('cmudhez1f000mofxrg9mnwqq1', '617.05.0082', '617.05.0082', 'AMT', 'HILAL LURAHMAN', '2026-09-23 02:26:32.547', '2026-09-23 03:36:17.335', 'AMT I'),
('cmudhez3t000nofxrei87xnv7', '617.05.0083', '617.05.0083', 'AMT', 'IDES SETIAWAN', '2026-09-23 02:26:32.633', '2026-09-23 03:36:17.337', 'AMT I'),
('cmudhez67000oofxr509guqjb', '617.05.0088', '617.05.0088', 'AMT', 'ISKANDAR', '2026-09-23 02:26:32.719', '2026-09-23 03:36:17.339', 'AMT II'),
('cmudhez8k000pofxrhwpednc1', '617.05.0098', '617.05.0098', 'AMT', 'KHARIS ADE TRIATMOKO', '2026-09-23 02:26:32.805', '2026-09-23 03:36:17.340', 'AMT I'),
('cmudhezay000qofxr6p7b81x0', '617.05.0106', '617.05.0106', 'AMT', 'MEI NURHAYAT', '2026-09-23 02:26:32.890', '2026-09-23 03:36:17.342', 'AMT I'),
('cmudhezdb000rofxrnxzqevms', '617.05.0108', '617.05.0108', 'AMT', 'MISDI MOHAMAD ARIF', '2026-09-23 02:26:32.975', '2026-09-23 03:36:17.344', 'AMT I'),
('cmudhezfs000sofxrxc5u6pk9', '617.05.0111', '617.05.0111', 'AMT', 'MUGIONO', '2026-09-23 02:26:33.064', '2026-09-23 03:36:17.345', 'AMT I'),
('cmudhezib000tofxrqvx6fs29', '617.05.0117', '617.05.0117', 'AMT', 'MUKHAERI', '2026-09-23 02:26:33.155', '2026-09-23 03:36:17.347', 'AMT I'),
('cmudhezku000uofxrfwkf4wcq', '617.05.0118', '617.05.0118', 'AMT', 'MUKHAMAD SYAEFUDIN', '2026-09-23 02:26:33.246', '2026-09-23 03:36:17.349', 'AMT I'),
('cmudheznf000vofxr6mwwwg0r', '617.05.0125', '617.05.0125', 'AMT', 'NISWANTO', '2026-09-23 02:26:33.340', '2026-09-23 03:36:17.351', 'AMT I'),
('cmudhezpx000wofxr4h3yg3cn', '617.05.0128', '617.05.0128', 'AMT', 'PARSONGKO', '2026-09-23 02:26:33.430', '2026-09-23 03:36:17.352', 'AMT II'),
('cmudhezsh000xofxrwg4u8707', '617.05.0129', '617.05.0129', 'AMT', 'PRIYANTO', '2026-09-23 02:26:33.522', '2026-09-23 03:36:17.354', 'AMT I'),
('cmudhezv1000yofxrqzn4oac0', '617.05.0130', '617.05.0130', 'AMT', 'PUJI PRIYANTO', '2026-09-23 02:26:33.613', '2026-09-23 03:36:17.356', 'AMT II'),
('cmudhezxl000zofxrpuzm9xyd', '617.05.0144', '617.05.0144', 'AMT', 'RUDI PARMONO', '2026-09-23 02:26:33.705', '2026-09-23 03:36:17.357', 'AMT II'),
('cmudhf0030010ofxrxbb7absd', '617.05.0145', '617.05.0145', 'AMT', 'RUDI PURWANTO', '2026-09-23 02:26:33.795', '2026-09-23 03:36:17.359', 'AMT II'),
('cmudhf02n0011ofxrvwqpsynh', '617.05.0146', '617.05.0146', 'AMT', 'RUSDIYANTO', '2026-09-23 02:26:33.887', '2026-09-23 03:36:17.361', 'AMT I'),
('cmudhf0560012ofxr1b0pktga', '617.05.0147', '617.05.0147', 'AMT', 'SABAR SANTOSA', '2026-09-23 02:26:33.978', '2026-09-23 03:36:17.363', 'AMT I'),
('cmudhf07q0013ofxr84ya4oc8', '617.05.0150', '617.05.0150', 'AMT', 'SAEFULLOH MAHFUDIN', '2026-09-23 02:26:34.070', '2026-09-23 03:36:17.364', 'AMT I'),
('cmudhf0a90014ofxrc60ipxtr', '617.05.0162', '617.05.0162', 'AMT', 'SINDU IRAWAN FREDYANSAH', '2026-09-23 02:26:34.161', '2026-09-23 03:36:17.366', 'AMT I'),
('cmudhf0ct0015ofxrc77fm0dr', '617.05.0163', '617.05.0163', 'AMT', 'SLAMET DODIT DARWOYO', '2026-09-23 02:26:34.253', '2026-09-23 03:36:17.367', 'AMT II'),
('cmudhf0fb0016ofxrzf3k71xe', '617.05.0172', '617.05.0172', 'AMT', 'SUGENG SUMARYOTO', '2026-09-23 02:26:34.343', '2026-09-23 03:36:17.369', 'AMT II'),
('cmudhf0hv0017ofxrdu8p52c4', '617.05.0173', '617.05.0173', 'AMT', 'SUGIARTO', '2026-09-23 02:26:34.435', '2026-09-23 03:36:17.371', 'AMT I'),
('cmudhf0kd0018ofxra0xvnenm', '617.05.0175', '617.05.0175', 'AMT', 'SUJAT', '2026-09-23 02:26:34.525', '2026-09-23 03:36:17.372', 'AMT II'),
('cmudhf0mw0019ofxrvs32b9w1', '617.05.0177', '617.05.0177', 'AMT', 'SUKMAEDI', '2026-09-23 02:26:34.616', '2026-09-23 03:36:17.374', 'AMT I'),
('cmudhf0pk001aofxrvgmfz7sp', '617.05.0179', '617.05.0179', 'AMT', 'SUMARDI', '2026-09-23 02:26:34.713', '2026-09-23 03:36:17.376', 'AMT II'),
('cmudhf0s2001bofxrasyhckg4', '617.05.0180', '617.05.0180', 'AMT', 'SUMINTO', '2026-09-23 02:26:34.802', '2026-09-23 03:36:17.377', 'AMT I'),
('cmudhf0ul001cofxrch1tlbm4', '617.05.0185', '617.05.0185', 'AMT', 'SUPRIYO', '2026-09-23 02:26:34.893', '2026-09-23 03:36:17.379', 'AMT I'),
('cmudhf0x5001dofxri66lfk49', '617.05.0186', '617.05.0186', 'AMT', 'SUSILO', '2026-09-23 02:26:34.986', '2026-09-23 03:36:17.380', 'AMT I'),
('cmudhf0zo001eofxr84a5m1pl', '617.05.0188', '617.05.0188', 'AMT', 'SUTARYO', '2026-09-23 02:26:35.076', '2026-09-23 03:36:17.382', 'AMT I'),
('cmudhf127001fofxrc7vpdqf0', '617.05.0190', '617.05.0190', 'AMT', 'SUYADI', '2026-09-23 02:26:35.167', '2026-09-23 03:36:17.384', 'AMT II'),
('cmudhf14p001gofxrrngq7m1j', '617.05.0196', '617.05.0196', 'AMT', 'TARMONO', '2026-09-23 02:26:35.257', '2026-09-23 03:36:17.385', 'AMT I'),
('cmudhf178001hofxrme7etblh', '617.05.0199', '617.05.0199', 'AMT', 'TEGUH MURDIYANTO', '2026-09-23 02:26:35.348', '2026-09-23 03:36:17.386', 'AMT II'),
('cmudhf19p001iofxrkcc9rbsk', '617.05.0200', '617.05.0200', 'AMT', 'TEGUH SUDIYANTO', '2026-09-23 02:26:35.437', '2026-09-23 03:36:17.388', 'AMT I'),
('cmudhf1c7001jofxr37bj636o', '617.05.0203', '617.05.0203', 'AMT', 'TEGUH SUSANTO', '2026-09-23 02:26:35.527', '2026-09-23 03:36:17.390', 'AMT I'),
('cmudhf1er001kofxrxz2tds8e', '617.05.0227', '617.05.0227', 'AMT', 'WIDIK SLAMET YUWONO', '2026-09-23 02:26:35.620', '2026-09-23 03:36:17.392', 'AMT II'),
('cmudhf1hc001lofxr0wixtcd7', '617.05.0233', '617.05.0233', 'AMT', 'YUDHI ARI CAHYONO', '2026-09-23 02:26:35.713', '2026-09-23 03:36:17.393', 'AMT I'),
('cmudhf1jw001mofxrsk2o3wva', '617.05.0235', '617.05.0235', 'AMT', 'YUSNUR TRIAJI', '2026-09-23 02:26:35.805', '2026-09-23 03:36:17.395', 'AMT I'),
('cmudhf1mg001nofxrnp1265bg', '617.05.0001', '617.05.0001', 'AMT', 'A SYARIF HIDAYATUROHMAN', '2026-09-23 02:26:35.896', '2026-09-23 03:36:17.396', 'AMT II'),
('cmudhf1oz001oofxr2e6mwyzt', '617.05.0004', '617.05.0004', 'AMT', 'ADI MITRA MULIYANA', '2026-09-23 02:26:35.988', '2026-09-23 03:36:17.398', 'AMT I'),
('cmudhf1ri001pofxr32ggzte7', '617.05.0264', '617.05.0264', 'AMT', 'AGUS TUSWANTO', '2026-09-23 02:26:36.078', '2026-09-23 03:36:17.400', 'AMT II'),
('cmudhf1u2001qofxr72iaraaj', '617.05.0265', '617.05.0265', 'AMT', 'Akhmad Sururudin', '2026-09-23 02:26:36.170', '2026-09-23 03:36:17.401', 'AMT II'),
('cmudhf1wn001rofxr72pur7bl', '617.05.0016', '617.05.0016', 'AMT', 'AMIN NURSALIM', '2026-09-23 02:26:36.263', '2026-09-23 03:36:17.403', 'AMT II'),
('cmudhf1z3001sofxrz6ff4auq', '617.05.0018', '617.05.0018', 'AMT', 'ANDRIYANTO', '2026-09-23 02:26:36.351', '2026-09-23 03:36:17.405', 'AMT I'),
('cmudhf21p001tofxrm7qpi6dl', '617.05.0019', '617.05.0019', 'AMT', 'ANJAR FEBRIANTO', '2026-09-23 02:26:36.445', '2026-09-23 03:36:17.406', 'AMT I'),
('cmudhf247001uofxrhe07928u', '617.05.0023', '617.05.0023', 'AMT', 'ARI SETIYADI', '2026-09-23 02:26:36.535', '2026-09-23 03:36:17.408', 'AMT II'),
('cmudhf26o001vofxrgpu3ygrr', '617.05.0024', '617.05.0024', 'AMT', 'ARIEF NUR DIANTO', '2026-09-23 02:26:36.624', '2026-09-23 03:36:17.409', 'AMT I'),
('cmudhf295001wofxrvel1zydd', '617.05.0025', '617.05.0025', 'AMT', 'ARIF GIYATNO', '2026-09-23 02:26:36.713', '2026-09-23 03:36:17.411', 'AMT I'),
('cmudhf2bq001xofxr0hk2eufp', '617.05.0031', '617.05.0031', 'AMT', 'BISRI MUSTOFA', '2026-09-23 02:26:36.806', '2026-09-23 03:36:17.413', 'AMT I'),
('cmudhf2ef001yofxro8cfdckt', '617.05.0033', '617.05.0033', 'AMT', 'BUDI HARTONO', '2026-09-23 02:26:36.904', '2026-09-23 03:36:17.414', 'AMT I'),
('cmudhf2gz001zofxreyz0np30', '617.05.0035', '617.05.0035', 'AMT', 'BUDI SUPRIYANTO', '2026-09-23 02:26:36.996', '2026-09-23 03:36:17.416', 'AMT I'),
('cmudhf2jg0020ofxrlix20ucz', '617.05.0036', '617.05.0036', 'AMT', 'CATUR RASRIYANTO', '2026-09-23 02:26:37.085', '2026-09-23 03:36:17.417', 'AMT I'),
('cmudhf2m30021ofxrrbg07va1', '617.05.0039', '617.05.0039', 'AMT', 'DAFIK NIKO SAMPURNA', '2026-09-23 02:26:37.180', '2026-09-23 03:36:17.419', 'AMT I'),
('cmudhf2os0022ofxrbssxctfu', '617.05.0045', '617.05.0045', 'AMT', 'DATIR', '2026-09-23 02:26:37.276', '2026-09-23 03:36:17.421', 'AMT I'),
('cmudhf2rg0023ofxrwvlmz1fm', '617.05.0046', '617.05.0046', 'AMT', 'DEDI NURKHOMSYAH', '2026-09-23 02:26:37.372', '2026-09-23 03:36:17.422', 'AMT I'),
('cmudhf2u50024ofxr3ob3yy5l', '617.05.0061', '617.05.0061', 'AMT', 'FADOLI', '2026-09-23 02:26:37.469', '2026-09-23 03:36:17.424', 'AMT II'),
('cmudhf2ws0025ofxrrin67588', '617.05.0062', '617.05.0062', 'AMT', 'FEBRI SUKMA AJI', '2026-09-23 02:26:37.564', '2026-09-23 03:36:17.425', 'AMT I'),
('cmudhf2zc0026ofxr7mqee4ro', '617.05.0065', '617.05.0065', 'AMT', 'FITRI FIDIANTORO', '2026-09-23 02:26:37.656', '2026-09-23 03:36:17.427', 'AMT I'),
('cmudhf31v0027ofxrnty0eotf', '617.05.0267', '617.05.0267', 'AMT', 'Hartono/k', '2026-09-23 02:26:37.747', '2026-09-23 03:36:17.428', 'AMT II'),
('cmudhf34e0028ofxrfqwkkcnm', '617.05.0077', '617.05.0077', 'AMT', 'HERI ISWANTO', '2026-09-23 02:26:37.838', '2026-09-23 03:36:17.430', 'AMT II'),
('cmudhf36v0029ofxr03j3i1o7', '617.05.0079', '617.05.0079', 'AMT', 'HERU NUGRIYANTO', '2026-09-23 02:26:37.927', '2026-09-23 03:36:17.431', 'AMT I'),
('cmudhf39d002aofxr4pq2ytx7', '617.04.073', '617.04.073', 'AMT', 'IBNU DARMAWAN', '2026-09-23 02:26:38.018', '2026-09-23 03:36:17.433', 'AMT I'),
('cmudhf3bx002bofxrzca4s55f', '617.05.0085', '617.05.0085', 'AMT', 'IMAM SYAIFULLAH', '2026-09-23 02:26:38.109', '2026-09-23 03:36:17.435', 'AMT II'),
('cmudhf3eg002cofxr82a9eyu0', '617.05.0093', '617.05.0093', 'AMT', 'KAMAN', '2026-09-23 02:26:38.200', '2026-09-23 03:36:17.436', 'AMT I'),
('cmudhf3h0002dofxrfo25mcvl', '617.05.0097', '617.05.0097', 'AMT', 'KASNO', '2026-09-23 02:26:38.292', '2026-09-23 03:36:17.438', 'AMT II'),
('cmudhf3jk002eofxr05m15bn8', '617.05.0099', '617.05.0099', 'AMT', 'KHAIRUL ANWAR', '2026-09-23 02:26:38.384', '2026-09-23 03:36:17.440', 'AMT II'),
('cmudhf3m3002fofxr5x8bttgy', '617.05.0101', '617.05.0101', 'AMT', 'KRIS YULIYANTO', '2026-09-23 02:26:38.475', '2026-09-23 03:36:17.441', 'AMT I'),
('cmudhf3oo002gofxrs8dx5ewi', '617.05.0103', '617.05.0103', 'AMT', 'LOTI PURTONI', '2026-09-23 02:26:38.568', '2026-09-23 03:36:17.443', 'AMT II'),
('cmudhf3r9002hofxri1p1pd6l', '617.05.0105', '617.05.0105', 'AMT', 'MARGONO', '2026-09-23 02:26:38.661', '2026-09-23 03:36:17.444', 'AMT II'),
('cmudhf3tu002iofxr383zie4f', '617.05.0109', '617.05.0109', 'AMT', 'MISLAM', '2026-09-23 02:26:38.755', '2026-09-23 03:36:17.446', 'AMT II'),
('cmudhf3wf002jofxrm5uj8s8e', '617.05.0110', '617.05.0110', 'AMT', 'MUGIANTO', '2026-09-23 02:26:38.847', '2026-09-23 03:36:17.447', 'AMT I'),
('cmudhf3z1002kofxroly3qvms', '617.05.0112', '617.05.0112', 'AMT', 'MUHAMAD ERVAN', '2026-09-23 02:26:38.942', '2026-09-23 03:36:17.449', 'AMT II'),
('cmudhf41k002lofxrxjpmxlio', '617.05.0122', '617.05.0122', 'AMT', 'NARYOTO', '2026-09-23 02:26:39.032', '2026-09-23 03:36:17.451', 'AMT I'),
('cmudhf443002mofxr9uwgx9id', '617.05.0123', '617.05.0123', 'AMT', 'NEDI WIRETNO', '2026-09-23 02:26:39.123', '2026-09-23 03:36:17.452', 'AMT I'),
('cmudhf46o002nofxrrzv5trbv', '617.05.0269', '617.05.0269', 'AMT', 'Nindi Arianto', '2026-09-23 02:26:39.217', '2026-09-23 03:36:17.454', 'AMT I'),
('cmudhf497002oofxr9i22eb3t', '617.05.0270', '617.05.0270', 'AMT', 'Pardan Triono Aji', '2026-09-23 02:26:39.308', '2026-09-23 03:36:17.456', 'AMT I'),
('cmudhf4bp002pofxrzsvlqi2l', '617.05.0131', '617.05.0131', 'AMT', 'PUJIONO', '2026-09-23 02:26:39.397', '2026-09-23 03:36:17.457', 'AMT II'),
('cmudhf4e7002qofxrj8vtehtn', '617.05.0132', '617.05.0132', 'AMT', 'R FILLA SANJAYA NEGARA', '2026-09-23 02:26:39.488', '2026-09-23 03:36:17.459', 'AMT I'),
('cmudhf4gu002rofxrnh31xyzl', '617.05.0134', '617.05.0134', 'AMT', 'RASITO', '2026-09-23 02:26:39.582', '2026-09-23 03:36:17.461', 'AMT I'),
('cmudhf4jh002sofxr6k6hv8mf', '617.05.0257', '617.05.0257', 'AMT', 'RASWAN', '2026-09-23 02:26:39.678', '2026-09-23 03:36:17.462', 'AMT I'),
('cmudhf4m1002tofxr3r4d04xb', '617.05.0148', '617.05.0148', 'AMT', 'SAEFUDIN', '2026-09-23 02:26:39.769', '2026-09-23 03:36:17.464', 'AMT II'),
('cmudhf4oj002uofxr2qmzhcml', '617.05.0149', '617.05.0149', 'AMT', 'SAEFUL ANAM', '2026-09-23 02:26:39.860', '2026-09-23 03:36:17.466', 'AMT II'),
('cmudhf4r2002vofxrch3ak66h', '617.05.0156', '617.05.0156', 'AMT', 'SARNO', '2026-09-23 02:26:39.951', '2026-09-23 03:36:17.468', 'AMT II'),
('cmudhf4tl002wofxrkeh82wyd', '617.05.0160', '617.05.0160', 'AMT', 'SHOLIHUL MUJIB ASYKURI', '2026-09-23 02:26:40.041', '2026-09-23 03:36:17.470', 'AMT I'),
('cmudhf4w4002xofxrrrlevz4l', '617.05.0164', '617.05.0164', 'AMT', 'SLAMET RIYADI', '2026-09-23 02:26:40.132', '2026-09-23 03:36:17.472', 'AMT I'),
('cmudhf4ym002yofxru9z1w7mt', '617.05.0165', '617.05.0165', 'AMT', 'SLAMET RIYANTO', '2026-09-23 02:26:40.222', '2026-09-23 03:36:17.473', 'AMT I'),
('cmudhf516002zofxr1y3vfsxd', '617.05.0167', '617.05.0167', 'AMT', 'SUDARNO', '2026-09-23 02:26:40.314', '2026-09-23 03:36:17.475', 'AMT I'),
('cmudhf53o0030ofxrb23cjg5z', '617.05.0170', '617.05.0170', 'AMT', 'SUGENG PRIYONO', '2026-09-23 02:26:40.404', '2026-09-23 03:36:17.477', 'AMT II'),
('cmudhf5690031ofxrwx40r4wf', '617.05.0176', '617.05.0176', 'AMT', 'SUKAMTO', '2026-09-23 02:26:40.497', '2026-09-23 03:36:17.478', 'AMT I'),
('cmudhf58v0032ofxrlhlkgjiw', '617.05.0178', '617.05.0178', 'AMT', 'SUMARDANI', '2026-09-23 02:26:40.591', '2026-09-23 03:36:17.480', 'AMT II'),
('cmudhf5be0033ofxrr0hfo6q4', '617.05.0259', '617.05.0259', 'AMT', 'SUMARDIYANTO', '2026-09-23 02:26:40.683', '2026-09-23 03:36:17.481', 'AMT I'),
('cmudhf5dy0034ofxrk7c8apfr', '617.05.0182', '617.05.0182', 'AMT', 'SUPARDI', '2026-09-23 02:26:40.774', '2026-09-23 03:36:17.483', 'AMT I'),
('cmudhf5gh0035ofxr5zae79iz', '617.05.0189', '617.05.0189', 'AMT', 'SUTRIYO', '2026-09-23 02:26:40.865', '2026-09-23 03:36:17.485', 'AMT I'),
('cmudhf5j10036ofxrg3kof5io', '617.05.0193', '617.05.0193', 'AMT', 'SYARIF MARDIONO', '2026-09-23 02:26:40.958', '2026-09-23 03:36:17.486', 'AMT I'),
('cmudhf5lj0037ofxrduiyalsv', '617.05.0194', '617.05.0194', 'AMT', 'TAOFIK BUDI PRATIKNO', '2026-09-23 02:26:41.047', '2026-09-23 03:36:17.488', 'AMT II'),
('cmudhf5o30038ofxr8t6kvmxe', '617.05.0210', '617.05.0210', 'AMT', 'TRI SUGIARTO', '2026-09-23 02:26:41.140', '2026-09-23 03:36:17.489', 'AMT I'),
('cmudhf5qj0039ofxr1nclwax0', '617.05.0261', '617.05.0261', 'AMT', 'TUGIYONO', '2026-09-23 02:26:41.227', '2026-09-23 03:36:17.491', 'AMT I'),
('cmudhf5sz003aofxryndge7p3', '617.05.0214', '617.05.0214', 'AMT', 'TUNJUNG ARIFUDIN', '2026-09-23 02:26:41.315', '2026-09-23 03:36:17.493', 'AMT I'),
('cmudhf5vc003bofxrw8cvcpfr', '617.05.0220', '617.05.0220', 'AMT', 'WAHYU DWIYONO PURNOMO', '2026-09-23 02:26:41.400', '2026-09-23 03:36:17.494', 'AMT I'),
('cmudhf5xq003cofxr6jtz1x46', '617.05.0223', '617.05.0223', 'AMT', 'WARSONO', '2026-09-23 02:26:41.486', '2026-09-23 03:36:17.496', 'AMT II'),
('cmudhf606003dofxrh2owivee', '617.05.0224', '617.05.0224', 'AMT', 'WAWAN KUSDIARTO', '2026-09-23 02:26:41.575', '2026-09-23 03:36:17.498', 'AMT II'),
('cmudhf62l003eofxrtwgqq3x7', '617.05.0234', '617.05.0234', 'AMT', 'YULIANDONO', '2026-09-23 02:26:41.661', '2026-09-23 03:36:17.500', 'AMT II'),
('cmudhf64y003fofxraaqa8gla', '617.05.0272', '617.05.0272', 'AMT', 'ADI KURNIAWAN', '2026-09-23 02:26:41.747', '2026-09-23 03:36:17.501', 'AMT I'),
('cmudhf67b003gofxr1jqdhdxj', '617.05.0273', '617.05.0273', 'AMT', 'GUSTI SAPUTRA', '2026-09-23 02:26:41.832', '2026-09-23 03:36:17.503', 'AMT II'),
('cmudhf69q003hofxrtyyifl65', '617.05.0274', '617.05.0274', 'AMT', 'HARYANTO', '2026-09-23 02:26:41.919', '2026-09-23 03:36:17.504', 'AMT I'),
('cmudhf6c3003iofxrspkr66vu', '617.05.0276', '617.05.0276', 'AMT', 'MUGIYONO', '2026-09-23 02:26:42.003', '2026-09-23 03:36:17.506', 'AMT I'),
('cmudhf6eg003jofxrtsfvrq95', '617.05.0277', '617.05.0277', 'AMT', 'RUDI KURNIAWAN', '2026-09-23 02:26:42.089', '2026-09-23 03:36:17.508', 'AMT II'),
('cmudhf6gu003kofxruoipj30e', '617.05.0278', '617.05.0278', 'AMT', 'SEPTIAN DARYANTO', '2026-09-23 02:26:42.175', '2026-09-23 03:36:17.509', 'AMT I'),
('cmudhf6j9003lofxr9tkyn3xj', '617.05.0279', '617.05.0279', 'AMT', 'TONI HARYANTO', '2026-09-23 02:26:42.262', '2026-09-23 03:36:17.511', 'AMT I'),
('cmudhf6lo003mofxr47wy7eb5', '617.04.0106', '617.04.0106', 'AMT', 'EDI PRAYITNO', '2026-09-23 02:26:42.348', '2026-09-23 03:36:17.513', 'AMT II'),
('cmudhf6o1003nofxry1z86qf7', '617.05.0282', '617.05.0282', 'AMT', 'ADI SAPUTRA', '2026-09-23 02:26:42.433', '2026-09-23 03:36:17.515', 'AMT I'),
('cmudhf6qg003oofxrki1twvjr', '617.05.0283', '617.05.0283', 'AMT', 'DAROJATI', '2026-09-23 02:26:42.520', '2026-09-23 03:36:17.517', 'AMT II'),
('cmudhf6su003pofxrc59rpunh', '617.05.0288', '617.05.0288', 'AMT', 'ARI SAPTANTO', '2026-09-23 02:26:42.607', '2026-09-23 03:36:17.518', 'AMT I'),
('cmudhf6v9003qofxr5zbqlx8e', '617.05.0289', '617.05.0289', 'AMT', 'HUMAM SOLIKHIN', '2026-09-23 02:26:42.693', '2026-09-23 03:36:17.520', 'AMT II'),
('cmudhf6xn003rofxrl383340l', '617.04.0117', '617.04.0117', 'AMT', 'DAFFI SUKMA HENDRA', '2026-09-23 02:26:42.780', '2026-09-23 03:36:17.521', 'AMT I'),
('cmudhf702003sofxrfiendmzg', '617.05.0292', '617.05.0292', 'AMT', 'BAYU SETIAWAN', '2026-09-23 02:26:42.867', '2026-09-23 03:36:17.523', 'AMT I'),
('cmudhf72j003tofxr3g62g9fy', '617.05.0293', '617.05.0293', 'AMT', 'DAROHMAN', '2026-09-23 02:26:42.955', '2026-09-23 03:36:17.525', 'AMT I'),
('cmudhf74y003uofxrjg5t507q', '617.05.0294', '617.05.0294', 'AMT', 'KADARMAN', '2026-09-23 02:26:43.043', '2026-09-23 03:36:17.526', 'AMT I'),
('cmudhf77c003vofxrqxe7zkib', '617.05.0295', '617.05.0295', 'AMT', 'MURDIYATNO', '2026-09-23 02:26:43.128', '2026-09-23 03:36:17.527', 'AMT I'),
('cmudhf79p003wofxrksyiswue', '617.05.0298', '617.05.0298', 'AMT', 'YOGIE ANGGARA', '2026-09-23 02:26:43.214', '2026-09-23 03:36:17.529', 'AMT I'),
('cmudhf7c4003xofxrl1sbxadc', '617.05.0302', '617.05.0302', 'AMT', 'MUHAMMAD LUTFI NURHIDAYAT', '2026-09-23 02:26:43.301', '2026-09-23 03:36:17.531', 'AMT I'),
('cmudhf7ei003yofxrbwnz67ak', '617.05.0310', '617.05.0310', 'AMT', 'ARDINAL', '2026-09-23 02:26:43.386', '2026-09-23 03:36:17.533', 'AMT I'),
('cmudhf7gw003zofxrh0nrerqh', '617.05.0313', '617.05.0313', 'AMT', 'MASINO', '2026-09-23 02:26:43.472', '2026-09-23 03:36:17.534', 'AMT I'),
('cmudhf7j90040ofxrdeje8kfs', '617.05.0314', '617.05.0314', 'AMT', 'OGI ANTORO', '2026-09-23 02:26:43.557', '2026-09-23 03:36:17.536', 'AMT I'),
('cmudhf7lo0041ofxr7f9u9tk5', '617.05.0315', '617.05.0315', 'AMT', 'SEPTI NUGROHO', '2026-09-23 02:26:43.645', '2026-09-23 03:36:17.538', 'AMT I'),
('cmudhf7o30042ofxr1m89vvja', '617.05.0316', '617.05.0316', 'AMT', 'SOBARI RAKHMAT AKHSANUDIN', '2026-09-23 02:26:43.731', '2026-09-23 03:36:17.539', 'AMT I'),
('cmudhf7qj0043ofxrb6fk3cqm', '617.05.0318', '617.05.0318', 'AMT', 'AGIE SANTIO', '2026-09-23 02:26:43.819', '2026-09-23 03:36:17.541', 'AMT I'),
('cmudhf7sy0044ofxrlh8fvpzo', '617.05.0323', '617.05.0323', 'AMT', 'SARYONO', '2026-09-23 02:26:43.906', '2026-09-23 03:36:17.543', 'AMT I'),
('cmudhf7vc0045ofxrudwx6bcc', '617.05.0324', '617.05.0324', 'AMT', 'SUGENG WAHYUDI', '2026-09-23 02:26:43.993', '2026-09-23 03:36:17.545', 'AMT II'),
('cmudhf7xp0046ofxrwk6ic0bi', '617.02.0484', '617.02.0484', 'AMT', 'NOVIAN ANDRIANTO', '2026-09-23 02:26:44.078', '2026-09-23 03:36:17.547', 'AMT I'),
('cmudhf8040047ofxra6s9nyxe', '617.04.0142', '617.04.0142', 'AMT', 'PRAPASA ROSNA PUTRA PRAMANA', '2026-09-23 02:26:44.164', '2026-09-23 03:36:17.548', 'AMT I'),
('cmudhf82j0048ofxrro559vm5', '617.05.0325', '617.05.0325', 'AMT', 'INSAN KUSUMA', '2026-09-23 02:26:44.251', '2026-09-23 03:36:17.550', 'AMT II'),
('cmudhf84x0049ofxr4aot750e', '617.02.0482', '617.02.0482', 'AMT', 'WARDI', '2026-09-23 02:26:44.338', '2026-09-23 03:36:17.552', 'AMT I'),
('cmudhf87b004aofxr4wh7z029', '617.05.0329', '617.05.0329', 'AMT', 'DWI BNI SALINAH ARIF', '2026-09-23 02:26:44.423', '2026-09-23 03:36:17.554', 'AMT I'),
('cmudhf89o004bofxr3ubfm9op', '617.05.0330', '617.05.0330', 'AMT', 'SARYOTO', '2026-09-23 02:26:44.508', '2026-09-23 03:36:17.555', 'AMT I'),
('cmudhf8c1004cofxrtkk1wkzc', '617.05.0333', '617.05.0333', 'AMT', 'ANTON SETIAWAN', '2026-09-23 02:26:44.594', '2026-09-23 03:36:17.557', 'AMT I'),
('cmudhf8eh004dofxr3lwfmr0u', '617.05.0334', '617.05.0334', 'AMT', 'AGUS PURNOMO', '2026-09-23 02:26:44.682', '2026-09-23 03:36:17.559', 'AMT I'),
('cmudhf8gw004eofxr8pms6qfm', '617.05.0335', '617.05.0335', 'AMT', 'IPUNG SUNARKO', '2026-09-23 02:26:44.768', '2026-09-23 03:36:17.561', 'AMT I'),
('cmudhf8j9004fofxrejnslcsr', '617.05.0336', '617.05.0336', 'AMT', 'KAMID DIANTO', '2026-09-23 02:26:44.854', '2026-09-23 03:36:17.563', 'AMT I'),
('cmudhf8lo004gofxrw35ll9at', '617.05.0338', '617.05.0338', 'AMT', 'KUSDIYONO', '2026-09-23 02:26:44.940', '2026-09-23 03:36:17.565', 'AMT I'),
('cmudhf8o1004hofxr2mumbfuc', '617.05.0339', '617.05.0339', 'AMT', 'MUHAMMAD ABDUL GHOFUR', '2026-09-23 02:26:45.026', '2026-09-23 03:36:17.566', 'AMT I'),
('cmudhf8qg004iofxr7oo1pdbu', '617.05.0341', '617.05.0341', 'AMT', 'SEPTIYAN DWI WIRANTO', '2026-09-23 02:26:45.112', '2026-09-23 03:36:17.568', 'AMT I'),
('cmudhf8su004jofxrv6j2xv8w', '617.05.0342', '617.05.0342', 'AMT', 'TIRSAM', '2026-09-23 02:26:45.198', '2026-09-23 03:36:17.569', 'AMT I'),
('cmudhf8v7004kofxr5b75e1zi', '617.05.0343', '617.05.0343', 'AMT', 'YUDI SETIAWAN', '2026-09-23 02:26:45.284', '2026-09-23 03:36:17.571', 'AMT I'),
('cmudhf8xl004lofxrlqedsyaw', '617.05.0345', '617.05.0345', 'AMT', 'AKHMAD KHANAFI', '2026-09-23 02:26:45.369', '2026-09-23 03:36:17.572', 'AMT I'),
('cmudhf8zz004mofxrmzou29ls', '617.05.0348', '617.05.0348', 'AMT', 'JIMMY WIDYANTORO', '2026-09-23 02:26:45.456', '2026-09-23 03:36:17.574', 'AMT II'),
('cmudhf92f004nofxr0lfmpp44', '617.05.0358', '617.05.0358', 'AMT', 'AFIF ISNAENI', '2026-09-23 02:26:45.543', '2026-09-23 03:36:17.575', 'AMT I'),
('cmudhf94s004oofxrwvwinzeq', '617.05.0357', '617.05.0357', 'AMT', 'AHMAD ILHAM', '2026-09-23 02:26:45.628', '2026-09-23 03:36:17.577', 'AMT I'),
('cmudhf975004pofxr0pk9k43e', '617.03.0186', '617.03.0186', 'AMT', 'TEGUH GUNADI', '2026-09-23 02:26:45.713', '2026-09-23 03:36:17.579', 'AMT I'),
('cmudhf99k004qofxr7u3369fh', '617.03.0148', '617.03.0148', 'AMT', 'SEPTIAN FREDI EKA PUTRA', '2026-09-23 02:26:45.801', '2026-09-23 03:36:17.581', 'AMT I'),
('cmudhf9by004rofxrtqzqia1l', '617.01.0816', '617.01.0816', 'AMT', 'ARIANTO', '2026-09-23 02:26:45.886', '2026-09-23 03:36:17.583', 'AMT I'),
('cmudhf9eb004sofxr11qo4n7t', '617.04.0119', '617.04.0119', 'AMT', 'IMAM CIPTO ARIWIBOWO', '2026-09-23 02:26:45.971', '2026-09-23 03:36:17.584', 'AMT II'),
('cmudhf9gp004tofxr6heiai9w', '617.01.0968', '617.01.0968', 'AMT', 'RUDI HARTONO', '2026-09-23 02:26:46.057', '2026-09-23 03:36:17.587', 'AMT I'),
('cmudhf9j3004uofxrc51g0ui8', '1222.05.0001', '1222.05.0001', 'AMT', 'Agung Pambudi', '2026-09-23 02:26:46.143', '2026-09-23 03:36:17.588', 'AMT I'),
('cmudhf9lg004vofxry3y9l4aa', '1222.05.0002', '1222.05.0002', 'AMT', 'Furqon Adi Sukmana', '2026-09-23 02:26:46.228', '2026-09-23 03:36:17.590', 'AMT II'),
('cmudhf9nu004wofxrn2upo8lx', '1222.05.0003', '1222.05.0003', 'AMT', 'Ikhsan Ardhi Julianto', '2026-09-23 02:26:46.315', '2026-09-23 03:36:17.592', 'AMT I'),
('cmudhf9q9004xofxrblil6wv9', '1222.05.0004', '1222.05.0004', 'AMT', 'Imam Suroso', '2026-09-23 02:26:46.402', '2026-09-23 03:36:17.594', 'AMT I'),
('cmudhf9sn004yofxrm89sbaaa', '1222.05.0006', '1222.05.0006', 'AMT', 'Mauhibul Itmam', '2026-09-23 02:26:46.487', '2026-09-23 03:36:17.595', 'AMT I'),
('cmudhf9v0004zofxr6o12bomj', '1222.05.0007', '1222.05.0007', 'AMT', 'Sriyanto', '2026-09-23 02:26:46.572', '2026-09-23 03:36:17.597', 'AMT I'),
('cmudhf9xd0050ofxrqbqsjce2', '1222.05.0008', '1222.05.0008', 'AMT', 'Sutiyono', '2026-09-23 02:26:46.657', '2026-09-23 03:36:17.599', 'AMT II'),
('cmudhf9zr0051ofxrzqsr96j0', '0523.05.0001', '0523.05.0001', 'AMT', 'Tuhu Susilowati', '2026-09-23 02:26:46.744', '2026-09-23 03:36:17.601', 'AMT I'),
('cmudhfa250052ofxrwucfgt6v', '0723.05.0001', '0723.05.0001', 'AMT', 'Anggi Balfas', '2026-09-23 02:26:46.829', '2026-09-23 03:36:17.603', 'AMT I'),
('cmudhfa4i0053ofxr13th0jgl', '1123.05.0001', '1123.05.0001', 'AMT', 'Feri Triono', '2026-09-23 02:26:46.915', '2026-09-23 03:36:17.605', 'AMT I'),
('cmudhfa6w0054ofxrkzts0mg3', '1123.05.0002', '1123.05.0002', 'AMT', 'Ghana Rafing Al Karoma', '2026-09-23 02:26:47.000', '2026-09-23 03:36:17.607', 'AMT I'),
('cmudhfa9a0055ofxrck8fm5h1', '1123.05.0003', '1123.05.0003', 'AMT', 'Riski Wahyu Hermawan', '2026-09-23 02:26:47.086', '2026-09-23 03:36:17.608', 'AMT I'),
('cmudhfabo0056ofxr5ct5zw5b', '1223.05.0001', '1223.05.0001', 'AMT', 'Andika Yogatama', '2026-09-23 02:26:47.172', '2026-09-23 03:36:17.610', 'AMT I'),
('cmudhfae10057ofxru9jqf3l9', '1223.05.0002', '1223.05.0002', 'AMT', 'Dani Setiawan', '2026-09-23 02:26:47.257', '2026-09-23 03:36:17.611', 'AMT I'),
('cmudhfagg0058ofxrzpqszgtf', '1223.05.0003', '1223.05.0003', 'AMT', 'Denny Ferianto', '2026-09-23 02:26:47.344', '2026-09-23 03:36:17.613', 'AMT I'),
('cmudhfaiu0059ofxreo3nhgz5', '1223.05.0006', '1223.05.0006', 'AMT', 'Sobari', '2026-09-23 02:26:47.430', '2026-09-23 03:36:17.615', 'AMT II'),
('cmudhfal9005aofxr7ug9z2fd', '617.01.0931', '617.01.0931', 'AMT', 'Sugeng Widodo', '2026-09-23 02:26:47.518', '2026-09-23 03:36:17.616', 'AMT I'),
('cmudhfanm005bofxroryvsa58', '617.01.0248', '617.01.0248', 'AMT', 'IDEA PANUT BAYUGA', '2026-09-23 02:26:47.603', '2026-09-23 03:36:17.618', 'AMT II'),
('cmudhfaq6005cofxrko7yk6uh', '617.01.0300', '617.01.0300', 'AMT', 'KRISTIYANTO', '2026-09-23 02:26:47.694', '2026-09-23 03:36:17.620', 'AMT I'),
('cmudhfasn005dofxrdpd8h0v0', '617.01.0500', '617.01.0500', 'AMT', 'SUROTO', '2026-09-23 02:26:47.783', '2026-09-23 03:36:17.622', 'AMT I'),
('cmudhfav1005eofxrk3xfizzy', '617.01.0893', '617.01.0893', 'AMT', 'Sutrisno', '2026-09-23 02:26:47.870', '2026-09-23 03:36:17.623', 'AMT I'),
('cmudhfaxg005fofxrnwpyyhln', '617.02.0685', '617.02.0685', 'AMT', 'Mochamad Fadhly Sumodirdjo', '2026-09-23 02:26:47.956', '2026-09-23 03:36:17.625', 'AMT I'),
('cmudhfazu005gofxrg4smrn5t', 'DW0124.01.26', 'DW0124.01.26', 'AMT', 'Sartono', '2026-09-23 02:26:48.042', '2026-09-23 03:36:17.626', 'AMT I'),
('cmudhfb28005hofxr7cc5qn1j', 'DW1223.05.01', 'DW1223.05.01', 'AMT', 'Alit Tri Kisworo', '2026-09-23 02:26:48.128', '2026-09-23 03:36:17.628', 'AMT I'),
('cmudhfb4n005iofxrkw5j5t1b', 'DW1223.05.04', 'DW1223.05.04', 'AMT', 'Dwi Septiawan', '2026-09-23 02:26:48.215', '2026-09-23 03:36:17.629', 'AMT I'),
('cmudhfb70005jofxrrlmu1htb', 'DW1223.05.05', 'DW1223.05.05', 'AMT', 'Feriyanto', '2026-09-23 02:26:48.300', '2026-09-23 03:36:17.631', 'AMT I'),
('cmudhfb9d005kofxrvgg6xtdp', 'DW1223.05.06', 'DW1223.05.06', 'AMT', 'Hilal Fatkhus Syurur', '2026-09-23 02:26:48.385', '2026-09-23 03:36:17.632', 'AMT I'),
('cmudhfbbs005lofxrdqindydo', 'DW1223.05.07', 'DW1223.05.07', 'AMT', 'Lasiman', '2026-09-23 02:26:48.473', '2026-09-23 03:36:17.634', 'AMT I'),
('cmudhfbe6005mofxr25177wgt', 'DW1223.05.08', 'DW1223.05.08', 'AMT', 'Muhammad Ikbal Agung Subkhi', '2026-09-23 02:26:48.559', '2026-09-23 03:36:17.635', 'AMT I'),
('cmudhfbgk005nofxr54nxxpp0', 'DW1223.05.09', 'DW1223.05.09', 'AMT', 'Pujiono/oc', '2026-09-23 02:26:48.644', '2026-09-23 03:36:17.637', 'AMT I'),
('cmudhfbiy005oofxr1tsoj44q', 'DW1223.05.10', 'DW1223.05.10', 'AMT', 'Tri Agus Handoko', '2026-09-23 02:26:48.730', '2026-09-23 03:36:17.639', 'AMT I'),
('cmudhfblc005pofxr7xm75ltg', 'DW1223.05.11', 'DW1223.05.11', 'AMT', 'Wahyu Almuarif', '2026-09-23 02:26:48.816', '2026-09-23 03:36:17.640', 'AMT I'),
('cmudhfbnp005qofxrg4ahz480', 'DW1223.05.12', 'DW1223.05.12', 'AMT', 'Wahyu Kurniawan', '2026-09-23 02:26:48.901', '2026-09-23 03:36:17.642', 'AMT I'),
('cmudhfbq3005rofxr3pdrpdna', 'DW0524.05.02', 'DW0524.05.02', 'AMT', 'Bagus Aziz Pratomo', '2026-09-23 02:26:48.988', '2026-09-23 03:36:17.644', 'AMT I'),
('cmudhfbsm005sofxr9j9oa7m6', 'DW0526.05.02', 'DW0526.05.02', 'AMT', 'NUR SOIMAN', '2026-09-23 02:26:49.078', '2026-09-23 03:36:17.645', 'AMT I'),
('cmudhfbv0005tofxrq55k3qvs', '824.08.01', '824.08.01', 'AMT', 'FEBRIAN ALDHIANTO', '2026-09-23 02:26:49.164', '2026-09-23 03:36:17.647', 'AMT II'),
('cmudhfbxm005uofxr5u6by8hh', '824.08.02', '824.08.02', 'AMT', 'HENDRI WINARSO', '2026-09-23 02:26:49.259', '2026-09-23 03:36:17.649', 'AMT II'),
('cmudhfc03005vofxr6fjvsp67', '824.08.03', '824.08.03', 'AMT', 'IRVAN WISNU T', '2026-09-23 02:26:49.348', '2026-09-23 03:36:17.650', 'AMT II'),
('cmudhfc2i005wofxrvwxeeg90', '824.08.04', '824.08.04', 'AMT', 'MAKHFUD FAUZI', '2026-09-23 02:26:49.434', '2026-09-23 03:36:17.652', 'AMT II'),
('cmudhfc4z005xofxrrg6wsns9', '617.01.0975', '617.01.0975', 'AMT', 'ARIF NURHUDIN', '2026-09-23 02:26:49.523', '2026-09-23 03:36:17.654', 'AMT I'),
('cmudhfc7d005yofxr6nyth53l', '617.02.0687', '617.02.0687', 'AMT', 'SATRIYO WIJI PRIYANTO', '2026-09-23 02:26:49.609', '2026-09-23 03:36:17.655', 'AMT I'),
('cmudhfc9q005zofxrr4d1itj7', '617.02.0688', '617.02.0688', 'AMT', 'SUTOYO', '2026-09-23 02:26:49.694', '2026-09-23 03:36:17.657', 'AMT I'),
('cmudhfcc30060ofxrfd9tyg64', '617.03.0351', '617.03.0351', 'AMT', 'Juli Andriantoro', '2026-09-23 02:26:49.779', '2026-09-23 03:36:17.659', 'AMT I'),
('cmudhfceh0061ofxrw0oy0xlr', '617.03.0389', '617.03.0389', 'AMT', 'Tulus Arifin', '2026-09-23 02:26:49.866', '2026-09-23 03:36:17.660', 'AMT I'),
('cmudhfcgv0062ofxr2072ccuf', 'DW1223.03.01', 'DW1223.03.01', 'AMT', 'Tomi Hidayat', '2026-09-23 02:26:49.952', '2026-09-23 03:36:17.662', 'AMT II'),
('cmudhfclp0064ofxrqpin0j78', '1024.02.0005', '1024.02.0005', 'AMT', 'Afif Hanif Firdaus', '2026-09-23 02:26:50.125', '2026-09-23 03:36:17.664', 'AMT II'),
('cmudhfco40065ofxr8gmt43jb', '1024.02.0006', '1024.02.0006', 'AMT', 'Alhimni Nur Ngilmi', '2026-09-23 02:26:50.212', '2026-09-23 03:36:17.665', 'AMT II'),
('cmudhfcqi0066ofxrsx4lnyx6', '1024.02.0007', '1024.02.0007', 'AMT', 'Budi Setiawan', '2026-09-23 02:26:50.298', '2026-09-23 03:36:17.668', 'AMT II'),
('cmudhfcsv0067ofxrlahg2483', '1024.02.0008', '1024.02.0008', 'AMT', 'Dwi Prasetyo', '2026-09-23 02:26:50.384', '2026-09-23 03:36:17.670', 'AMT II'),
('cmudhfcv90068ofxrohjfy5i8', '1024.02.0009', '1024.02.0009', 'AMT', 'Eko Saputra', '2026-09-23 02:26:50.469', '2026-09-23 03:36:17.672', 'AMT II'),
('cmudhfcxn0069ofxrvd9qu2aw', '1024.02.0010', '1024.02.0010', 'AMT', 'Hartono/mos', '2026-09-23 02:26:50.555', '2026-09-23 03:36:17.673', 'AMT II'),
('cmudhfd00006aofxrbfhxr318', '1024.02.0012', '1024.02.0012', 'AMT', 'Saeful Humam', '2026-09-23 02:26:50.641', '2026-09-23 03:36:17.675', 'AMT II'),
('cmudhfd2e006bofxrsq8ir6b2', '1024.02.0013', '1024.02.0013', 'AMT', 'Taat Pambudi', '2026-09-23 02:26:50.726', '2026-09-23 03:36:17.677', 'AMT II'),
('cmudhfd4r006cofxrf6lh4m2w', '1024.02.0014', '1024.02.0014', 'AMT', 'Ubed Khoiri', '2026-09-23 02:26:50.812', '2026-09-23 03:36:17.679', 'AMT II'),
('cmudhfd75006dofxrs2vjuezo', '1124.02.0015', '1124.02.0015', 'AMT', 'Aditya Nur Pratama', '2026-09-23 02:26:50.897', '2026-09-23 03:36:17.680', 'AMT II'),
('cmudhfd9j006eofxrt5ff7sbv', '1124.02.0018', '1124.02.0018', 'AMT', 'Rigi Astono', '2026-09-23 02:26:50.983', '2026-09-23 03:36:17.683', 'AMT II'),
('cmudhfdbw006fofxrcj3ohb32', '1124.02.0019', '1124.02.0019', 'AMT', 'Roni Priyanto', '2026-09-23 02:26:51.069', '2026-09-23 03:36:17.685', 'AMT II'),
('cmudhfde9006gofxr14gjetiu', '1124.02.0020', '1124.02.0020', 'AMT', 'Suharno', '2026-09-23 02:26:51.154', '2026-09-23 03:36:17.686', 'AMT II'),
('cmudhfdgn006hofxrj2xzhmkt', '0723.01.0010', '0723.01.0010', 'AMT', 'Roli Eko Putro', '2026-09-23 02:26:51.240', '2026-09-23 03:36:17.688', 'AMT I'),
('cmudhfdj1006iofxrulz9bx23', '0723.01.0001', '0723.01.0001', 'AMT', 'Ainun Najjib', '2026-09-23 02:26:51.325', '2026-09-23 03:36:17.689', 'AMT I'),
('cmudhfdle006jofxr1fmzi2td', 'DW0724.01.67', 'DW0724.01.67', 'AMT', 'Akhmad Fauzi', '2026-09-23 02:26:51.411', '2026-09-23 03:36:17.691', 'AMT I'),
('cmudhfdns006kofxrg88die3b', 'DW0224.01.35', 'DW0224.01.35', 'AMT', 'Subowo', '2026-09-23 02:26:51.496', '2026-09-23 03:36:17.693', 'AMT I'),
('cmudhfdq7006lofxr0xfcgcgl', 'DW0224.01.38', 'DW0224.01.38', 'AMT', 'Kunto Waluyo', '2026-09-23 02:26:51.584', '2026-09-23 03:36:17.695', 'AMT I'),
('cmudhfdsk006mofxr1t1xg1am', 'DW1124.01.89', 'DW1124.01.89', 'AMT', 'Wahyu Pratama Meliano', '2026-09-23 02:26:51.668', '2026-09-23 03:36:17.697', 'AMT I'),
('cmudhfdux006nofxrhjfbvp3h', '1224.02.0021', '1224.02.0021', 'AMT', 'Abas Haryanto', '2026-09-23 02:26:51.754', '2026-09-23 03:36:17.699', 'AMT II'),
('cmudhfdxb006oofxrdwc2ffsv', '1224.02.0022', '1224.02.0022', 'AMT', 'Agus Mursidin', '2026-09-23 02:26:51.840', '2026-09-23 03:36:17.701', 'AMT II'),
('cmudhfdzp006pofxrczqk9kix', '1224.02.0023', '1224.02.0023', 'AMT', 'Amin Wahyudianto', '2026-09-23 02:26:51.926', '2026-09-23 03:36:17.702', 'AMT II'),
('cmudhfe24006qofxrv9ud2q4s', '1224.02.0024', '1224.02.0024', 'AMT', 'Ariswanto', '2026-09-23 02:26:52.013', '2026-09-23 03:36:17.704', 'AMT II'),
('cmudhfe4h006rofxrkf1u2y2h', '1224.02.0025', '1224.02.0025', 'AMT', 'Budi Sulistiyo', '2026-09-23 02:26:52.098', '2026-09-23 03:36:17.706', 'AMT II'),
('cmudhfe6v006sofxr94rbd1gu', '1224.02.0027', '1224.02.0027', 'AMT', 'Hartono/HB', '2026-09-23 02:26:52.183', '2026-09-23 03:36:17.707', 'AMT II'),
('cmudhfe99006tofxrmtuudyjp', '1224.02.0028', '1224.02.0028', 'AMT', 'Jemy Resa Prabowo', '2026-09-23 02:26:52.270', '2026-09-23 03:36:17.709', 'AMT II'),
('cmudhfebm006uofxrmboguoux', '1224.02.0029', '1224.02.0029', 'AMT', 'Kholid Iskandar', '2026-09-23 02:26:52.354', '2026-09-23 03:36:17.711', 'AMT II'),
('cmudhfedz006vofxrtzg3btnx', '1224.02.0030', '1224.02.0030', 'AMT', 'Mochamad Hamdan Wardani', '2026-09-23 02:26:52.440', '2026-09-23 03:36:17.713', 'AMT II'),
('cmudhfegd006wofxrq95wyek1', '1224.02.0031', '1224.02.0031', 'AMT', 'Muhamad Sururudin', '2026-09-23 02:26:52.525', '2026-09-23 03:36:17.714', 'AMT II'),
('cmudhfeir006xofxrv7v56lvh', '1224.02.0032', '1224.02.0032', 'AMT', 'Rakhmat Fikri Basuki', '2026-09-23 02:26:52.611', '2026-09-23 03:36:17.716', 'AMT II'),
('cmudhfel5006yofxrt2gmxrzs', '1224.02.0033', '1224.02.0033', 'AMT', 'Rianto', '2026-09-23 02:26:52.697', '2026-09-23 03:36:17.719', 'AMT II'),
('cmudhfeni006zofxrqpbhpbt3', '1224.02.0034', '1224.02.0034', 'AMT', 'Rubandi', '2026-09-23 02:26:52.783', '2026-09-23 03:36:17.721', 'AMT II'),
('cmudhfepw0070ofxr3wt5rfag', '1224.02.0035', '1224.02.0035', 'AMT', 'Sarno/k', '2026-09-23 02:26:52.868', '2026-09-23 03:36:17.722', 'AMT II'),
('cmudhfesa0071ofxrlm7gwvhs', '1224.02.0036', '1224.02.0036', 'AMT', 'Sugeng Riyadi/k', '2026-09-23 02:26:52.954', '2026-09-23 03:36:17.724', 'AMT II'),
('cmudhfeun0072ofxr850bpy4o', '1224.02.0037', '1224.02.0037', 'AMT', 'Sutaryo/k', '2026-09-23 02:26:53.040', '2026-09-23 03:36:17.726', 'AMT II'),
('cmudhfex20073ofxr7upls00n', '0125.02.0002', '0125.02.0002', 'AMT', 'Ageng Setiawan', '2026-09-23 02:26:53.126', '2026-09-23 03:36:17.728', 'AMT II'),
('cmudhfezg0074ofxrxbrv7jju', '0125.02.0003', '0125.02.0003', 'AMT', 'Agung Budhy Santoso', '2026-09-23 02:26:53.213', '2026-09-23 03:36:17.731', 'AMT II'),
('cmudhff1y0075ofxrzy7ym5ky', '0125.02.0004', '0125.02.0004', 'AMT', 'Agung Prasetyo', '2026-09-23 02:26:53.302', '2026-09-23 03:36:17.733', 'AMT II'),
('cmudhff4c0076ofxr4i9gc2i2', '0125.02.0005', '0125.02.0005', 'AMT', 'Agus Setiyo Priambudi', '2026-09-23 02:26:53.388', '2026-09-23 03:36:17.734', 'AMT II'),
('cmudhff6p0077ofxrf9n8kf3o', '0125.02.0006', '0125.02.0006', 'AMT', 'Amin Fatchurohman', '2026-09-23 02:26:53.473', '2026-09-23 03:36:17.736', 'AMT II'),
('cmudhff930078ofxrdkucdahc', '0125.02.0008', '0125.02.0008', 'AMT', 'Andre Farhan Firmansyah', '2026-09-23 02:26:53.559', '2026-09-23 03:36:17.738', 'AMT II'),
('cmudhffbh0079ofxrzlj5f96u', '0125.02.0011', '0125.02.0011', 'AMT', 'Aris Susanto', '2026-09-23 02:26:53.645', '2026-09-23 03:36:17.739', 'AMT II'),
('cmudhffdv007aofxricojp6wo', '0125.02.0012', '0125.02.0012', 'AMT', 'Budiono', '2026-09-23 02:26:53.731', '2026-09-23 03:36:17.741', 'AMT II'),
('cmudhffg9007bofxrgltiwtdx', '0125.02.0013', '0125.02.0013', 'AMT', 'Dahri Afkar Zaki', '2026-09-23 02:26:53.818', '2026-09-23 03:36:17.743', 'AMT II'),
('cmudhffin007cofxrwja6ohkb', '0125.02.0014', '0125.02.0014', 'AMT', 'Delfany Eka Setyawan', '2026-09-23 02:26:53.904', '2026-09-23 03:36:17.745', 'AMT II'),
('cmudhffl3007dofxr2hsz47bp', '0125.02.0016', '0125.02.0016', 'AMT', 'Dirno', '2026-09-23 02:26:53.991', '2026-09-23 03:36:17.747', 'AMT II'),
('cmudhffnm007eofxro0udrbkw', '0125.02.0017', '0125.02.0017', 'AMT', 'Dizkri Nugroho', '2026-09-23 02:26:54.082', '2026-09-23 03:36:17.748', 'AMT II'),
('cmudhffpz007fofxryb6mjq7a', '0125.02.0019', '0125.02.0019', 'AMT', 'Eki Setiawan', '2026-09-23 02:26:54.167', '2026-09-23 03:36:17.750', 'AMT II'),
('cmudhffsd007gofxrroqksgow', '0125.02.0021', '0125.02.0021', 'AMT', 'Hafiudin Achmad', '2026-09-23 02:26:54.253', '2026-09-23 03:36:17.752', 'AMT II'),
('cmudhffus007hofxr047031y7', '0125.02.0023', '0125.02.0023', 'AMT', 'Hendrik Robiansyah', '2026-09-23 02:26:54.340', '2026-09-23 03:36:17.754', 'AMT II'),
('cmudhffx7007iofxrq59yp9tx', '0125.02.0024', '0125.02.0024', 'AMT', 'Idris Adi Riyanto', '2026-09-23 02:26:54.427', '2026-09-23 03:36:17.755', 'AMT II'),
('cmudhffzl007jofxrzcamduzw', '0125.02.0026', '0125.02.0026', 'AMT', 'Junianto', '2026-09-23 02:26:54.514', '2026-09-23 03:36:17.757', 'AMT II'),
('cmudhfg1y007kofxrgw2hmppo', '0125.02.0027', '0125.02.0027', 'AMT', 'Khusni Mubarok', '2026-09-23 02:26:54.599', '2026-09-23 03:36:17.759', 'AMT II'),
('cmudhfg4d007lofxrxdf28aja', '0125.02.0028', '0125.02.0028', 'AMT', 'Kirsun', '2026-09-23 02:26:54.685', '2026-09-23 03:36:17.761', 'AMT II'),
('cmudhfg6q007mofxraqtjb0fq', '0125.02.0029', '0125.02.0029', 'AMT', 'Kuat Sutrisno', '2026-09-23 02:26:54.771', '2026-09-23 03:36:17.763', 'AMT II'),
('cmudhfg93007nofxrywxebk8y', '0125.02.0030', '0125.02.0030', 'AMT', 'Misbahul Anwar', '2026-09-23 02:26:54.856', '2026-09-23 03:36:17.764', 'AMT II'),
('cmudhfgbh007oofxrbzkhhagz', '0125.02.0031', '0125.02.0031', 'AMT', 'Moh Yusup', '2026-09-23 02:26:54.942', '2026-09-23 03:36:17.766', 'AMT II'),
('cmudhfgdx007pofxrz4lurbnd', '0125.02.0033', '0125.02.0033', 'AMT', 'Naryanto', '2026-09-23 02:26:55.029', '2026-09-23 03:36:17.768', 'AMT II'),
('cmudhfggc007qofxrp25za1x6', '0125.02.0034', '0125.02.0034', 'AMT', 'Nofi Ade Saputro', '2026-09-23 02:26:55.117', '2026-09-23 03:36:17.769', 'AMT II'),
('cmudhfgiq007rofxrbwslhn1b', '0125.02.0036', '0125.02.0036', 'AMT', 'Reza Arviyan', '2026-09-23 02:26:55.202', '2026-09-23 03:36:17.771', 'AMT II'),
('cmudhfgl3007sofxr4dexwb6b', '0125.02.0037', '0125.02.0037', 'AMT', 'Rilo Prasdika Utomo', '2026-09-23 02:26:55.288', '2026-09-23 03:36:17.773', 'AMT II'),
('cmudhfgnh007tofxr0gd6mrmg', '0125.02.0038', '0125.02.0038', 'AMT', 'Rizky Eka Setiawan', '2026-09-23 02:26:55.373', '2026-09-23 03:36:17.774', 'AMT II'),
('cmudhfgpv007uofxronmc0ua5', '0125.02.0039', '0125.02.0039', 'AMT', 'Saehan Afandi', '2026-09-23 02:26:55.459', '2026-09-23 03:36:17.776', 'AMT II'),
('cmudhfgs8007vofxrueajdm8o', '0125.02.0040', '0125.02.0040', 'AMT', 'Satrio Bagus Prakoso', '2026-09-23 02:26:55.544', '2026-09-23 03:36:17.777', 'AMT II'),
('cmudhfgul007wofxrx01yp2nw', '0125.02.0041', '0125.02.0041', 'AMT', 'Seto Hendro Saputro', '2026-09-23 02:26:55.630', '2026-09-23 03:36:17.779', 'AMT II'),
('cmudhfgwz007xofxrwq809ppi', '0125.02.0042', '0125.02.0042', 'AMT', 'Solihin', '2026-09-23 02:26:55.716', '2026-09-23 03:36:17.781', 'AMT II'),
('cmudhfgzf007yofxrdjobdovb', '0125.02.0043', '0125.02.0043', 'AMT', 'Sukarman', '2026-09-23 02:26:55.803', '2026-09-23 03:36:17.783', 'AMT II'),
('cmudhfh1s007zofxrcleapowc', '0125.02.0044', '0125.02.0044', 'AMT', 'Supriyanto', '2026-09-23 02:26:55.888', '2026-09-23 03:36:17.785', 'AMT II'),
('cmudhfh460080ofxrtwhjmuay', '0125.02.0045', '0125.02.0045', 'AMT', 'Sutiono', '2026-09-23 02:26:55.975', '2026-09-23 03:36:17.786', 'AMT II'),
('cmudhfh6k0081ofxrdkgt3ssl', '0125.02.0046', '0125.02.0046', 'AMT', 'Tangguh Hari Pratama', '2026-09-23 02:26:56.060', '2026-09-23 03:36:17.789', 'AMT II'),
('cmudhfh8y0082ofxr9zdew36a', '0125.02.0047', '0125.02.0047', 'AMT', 'Trias Mey Pambudi', '2026-09-23 02:26:56.147', '2026-09-23 03:36:17.790', 'AMT II'),
('cmudhfhbc0083ofxre9y2qmdq', '0125.02.0048', '0125.02.0048', 'AMT', 'Yogi Adi Pratama', '2026-09-23 02:26:56.232', '2026-09-23 03:36:17.792', 'AMT II'),
('cmudhfhdp0084ofxrouon2fn6', '0125.02.0020', '0125.02.0020', 'AMT', 'Farid Nur Aziz', '2026-09-23 02:26:56.317', '2026-09-23 03:36:17.794', 'AMT II'),
('cmudhfhg40085ofxr6okwk9ji', '0125.02.0009', '0125.02.0009', 'AMT', 'Anugrah Margo Yuwono', '2026-09-23 02:26:56.404', '2026-09-23 03:36:17.795', 'AMT II'),
('cmudhfhii0086ofxrkjf4rglr', '0125.02.0010', '0125.02.0010', 'AMT', 'Arifin Kusumaadhyatma', '2026-09-23 02:26:56.490', '2026-09-23 03:36:17.797', 'AMT II'),
('cmudhfhkv0087ofxrmrh92msl', '0125.02.0018', '0125.02.0018', 'AMT', 'Doni Sektiawan', '2026-09-23 02:26:56.576', '2026-09-23 03:36:17.798', 'AMT II'),
('cmudhfhn90088ofxrkmic1kyb', '0125.02.0022', '0125.02.0022', 'AMT', 'Harjanto', '2026-09-23 02:26:56.661', '2026-09-23 03:36:17.800', 'AMT II'),
('cmudhfhpn0089ofxrbj0uk6j8', '0125.02.0007', '0125.02.0007', 'AMT', 'Andika Subroto', '2026-09-23 02:26:56.748', '2026-09-23 03:36:17.802', 'AMT II'),
('cmudhfhs1008aofxrpawj1n4s', '0125.02.0015', '0125.02.0015', 'AMT', 'Dimas Adi Prayogo', '2026-09-23 02:26:56.834', '2026-09-23 03:36:17.804', 'AMT II'),
('cmudhfhue008bofxrgmy6zu1i', '0125.02.0025', '0125.02.0025', 'AMT', 'Idza Mustaqim', '2026-09-23 02:26:56.919', '2026-09-23 03:36:17.805', 'AMT II'),
('cmudhfhws008cofxr63pvbesu', '0125.02.0032', '0125.02.0032', 'AMT', 'Mohamad Maryono', '2026-09-23 02:26:57.004', '2026-09-23 03:36:17.807', 'AMT II'),
('cmudhfhz5008dofxrmafffyyk', '0125.02.0035', '0125.02.0035', 'AMT', 'Priyadi', '2026-09-23 02:26:57.089', '2026-09-23 03:36:17.809', 'AMT II'),
('cmudhfi1i008eofxrucjsr12r', '0325.02.0049', '0325.02.0049', 'AMT', 'Ahmad Janan Al Latif', '2026-09-23 02:26:57.175', '2026-09-23 03:36:17.811', 'AMT II'),
('cmudhfi3w008fofxrkvb27n4p', '0325.02.0050', '0325.02.0050', 'AMT', 'Andy Aldiansyah', '2026-09-23 02:26:57.260', '2026-09-23 03:36:17.812', 'AMT II'),
('cmudhfi69008gofxrxlk37p4i', '0325.02.0051', '0325.02.0051', 'AMT', 'Arif Hidayatulloh', '2026-09-23 02:26:57.346', '2026-09-23 03:36:17.814', 'AMT II'),
('cmudhfi8n008hofxrsf07lm4k', '0325.02.0052', '0325.02.0052', 'AMT', 'Bayu Asrori Jati', '2026-09-23 02:26:57.431', '2026-09-23 03:36:17.816', 'AMT II'),
('cmudhfib0008iofxrsrmi6qzr', '0325.02.0053', '0325.02.0053', 'AMT', 'Bustanul Ma\'arif Firdausi', '2026-09-23 02:26:57.517', '2026-09-23 03:36:17.817', 'AMT II'),
('cmudhfidd008jofxrflwdvdsg', '0325.02.0054', '0325.02.0054', 'AMT', 'Devit Firmansyah', '2026-09-23 02:26:57.602', '2026-09-23 03:36:17.819', 'AMT II'),
('cmudhfifr008kofxrjdoyxsyo', '0325.02.0055', '0325.02.0055', 'AMT', 'Fajar Nur Hidayat', '2026-09-23 02:26:57.687', '2026-09-23 03:36:17.821', 'AMT II'),
('cmudhfii5008lofxr1ist2byd', '0325.02.0056', '0325.02.0056', 'AMT', 'Iis Juniawan', '2026-09-23 02:26:57.773', '2026-09-23 03:36:17.822', 'AMT II'),
('cmudhfiki008mofxr19fyduq7', '0325.02.0058', '0325.02.0058', 'AMT', 'Miko Firmansyah', '2026-09-23 02:26:57.858', '2026-09-23 03:36:17.824', 'AMT II'),
('cmudhfimv008nofxrx2akkt73', '0325.02.0060', '0325.02.0060', 'AMT', 'Noaf Dwi Prakoso', '2026-09-23 02:26:57.944', '2026-09-23 03:36:17.825', 'AMT II'),
('cmudhfip9008oofxr6a7f3hfy', '0325.02.0061', '0325.02.0061', 'AMT', 'Rizal Andika Vikri', '2026-09-23 02:26:58.029', '2026-09-23 03:36:17.827', 'AMT II'),
('cmudhfirm008pofxrwefyyw5f', '0325.02.0062', '0325.02.0062', 'AMT', 'Rizkyana Galih Nugroho', '2026-09-23 02:26:58.115', '2026-09-23 03:36:17.829', 'AMT II'),
('cmudhfitz008qofxr2pp0pp7b', '0325.02.0063', '0325.02.0063', 'AMT', 'Septo Pamungkas', '2026-09-23 02:26:58.200', '2026-09-23 03:36:17.830', 'AMT II'),
('cmudhfiwl008rofxrntlpg6ed', '0325.02.0064', '0325.02.0064', 'AMT', 'Sibuyung', '2026-09-23 02:26:58.293', '2026-09-23 03:36:17.832', 'AMT II'),
('cmudhfiz4008sofxrarchkzuk', '0325.02.0066', '0325.02.0066', 'AMT', 'Tunggul Prayogi', '2026-09-23 02:26:58.384', '2026-09-23 03:36:17.834', 'AMT II'),
('cmudhfj1k008tofxrd53wohml', '0325.02.0067', '0325.02.0067', 'AMT', 'ULUL AZIS', '2026-09-23 02:26:58.472', '2026-09-23 03:36:17.836', 'AMT II'),
('cmudhfj3z008uofxrs77bw8mk', '0325.02.0068', '0325.02.0068', 'AMT', 'Wiji Kurnia Sandi', '2026-09-23 02:26:58.559', '2026-09-23 03:36:17.838', 'AMT II'),
('cmudhfj6c008vofxr40ady96n', '0325.02.0069', '0325.02.0069', 'AMT', 'Bima Ari Prakoso Junaedi', '2026-09-23 02:26:58.645', '2026-09-23 03:36:17.840', 'AMT II'),
('cmudhfj8r008wofxriq5dbppz', '0325.02.0070', '0325.02.0070', 'AMT', 'Purnomo', '2026-09-23 02:26:58.731', '2026-09-23 03:36:17.842', 'AMT II'),
('cmudhfjb4008xofxr0r3hgqhv', '617.03.0015', '617.03.0015', 'AMT', 'Aan Naryanto', '2026-09-23 02:26:58.817', '2026-09-23 03:36:17.844', 'AMT I'),
('cmudhfjdj008yofxrt678xbyo', '617.03.0087', '617.03.0087', 'AMT', 'Indra Riyadi', '2026-09-23 02:26:58.904', '2026-09-23 03:36:17.846', 'AMT I'),
('cmudhfjfy008zofxrexgd7l86', '0725.02.0070', '0725.02.0070', 'AMT', 'Rizki Nurcahyo', '2026-09-23 02:26:58.991', '2026-09-23 03:36:17.847', 'AMT I'),
('cmudhfjid0090ofxr326rwtq9', '0725.02.0071', '0725.02.0071', 'AMT', 'Sukiran', '2026-09-23 02:26:59.077', '2026-09-23 03:36:17.850', 'AMT I'),
('cmudhfjks0091ofxrn8mfq219', '0925.05.0072', '0925.05.0072', 'AMT', 'Novizul Agung Wicaksono', '2026-09-23 02:26:59.164', '2026-09-23 03:36:17.852', 'AMT I'),
('cmudhfjn50092ofxr5umvfhdv', '1024.02.0011', '1024.02.0011', 'AMT', 'Nanang Sugiyanto', '2026-09-23 02:26:59.249', '2026-09-23 03:36:17.853', 'AMT II'),
('cmudhfjpj0093ofxrk2mhxog7', '1125.02.0074', '1125.02.0074', 'AMT', 'Mochamad Zuhrul Anam', '2026-09-23 02:26:59.335', '2026-09-23 03:36:17.855', 'AMT I'),
('cmudhfjrw0094ofxrz312bhns', '1125.02.0073', '1125.02.0073', 'AMT', 'Rojat', '2026-09-23 02:26:59.420', '2026-09-23 03:36:17.857', 'AMT I'),
('cmudhfjua0095ofxrwca60xvn', '1125.01.0130', '1125.01.0130', 'AMT', 'Porki Agustian', '2026-09-23 02:26:59.506', '2026-09-23 03:36:17.859', 'AMT I'),
('cmudhfjwo0096ofxr90ygsc72', '1125.02.001', '1125.02.001', 'AMT', 'ADAM YOGIANSYAH', '2026-09-23 02:26:59.592', '2026-09-23 03:36:17.860', 'AMT II'),
('cmudhfjz20097ofxrg62w5suf', '0325.02.104', '0325.02.104', 'AMT', 'DIDIT TRISUHARYANTO', '2026-09-23 02:26:59.678', '2026-09-23 03:36:17.862', 'AMT II');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle`
--

CREATE TABLE `vehicle` (
  `id` varchar(191) NOT NULL,
  `noPolisi` varchar(191) NOT NULL,
  `barcode` varchar(191) NOT NULL,
  `jenisKendaraan` varchar(191) DEFAULT NULL,
  `brand` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicle`
--

INSERT INTO `vehicle` (`id`, `noPolisi`, `barcode`, `jenisKendaraan`, `brand`, `status`, `createdAt`, `updatedAt`) VALUES
('cmudhfk720098ofxr77agp37d', 'AA8410OP', 'AA8410OP', '24 KL', '', 'Active', '2026-09-23 02:26:59.966', '2026-09-23 02:26:59.966'),
('cmudhfk750099ofxrjog6ryb5', 'AD8603OH', 'AD8603OH', '24 KL', '', 'Active', '2026-09-23 02:26:59.970', '2026-09-23 02:26:59.970'),
('cmudhfk77009aofxrl5ncl620', 'AD8618OH', 'AD8618OH', '24 KL', '', 'Active', '2026-09-23 02:26:59.972', '2026-09-23 02:26:59.972'),
('cmudhfk79009bofxrr3flkhaw', 'B9077SEI', 'B9077SEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.973', '2026-09-23 02:26:59.973'),
('cmudhfk7b009cofxrzcpa2c3c', 'B9106SEI', 'B9106SEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.975', '2026-09-23 02:26:59.975'),
('cmudhfk7d009dofxr1qy2bgfl', 'B9290TFV', 'B9290TFV', '24 KL', '', 'Active', '2026-09-23 02:26:59.977', '2026-09-23 02:26:59.977'),
('cmudhfk7f009eofxrnhayxb03', 'B9355TFV', 'B9355TFV', '24 KL', '', 'Active', '2026-09-23 02:26:59.979', '2026-09-23 02:26:59.979'),
('cmudhfk7g009fofxr48pp539w', 'B9425TEK', 'B9425TEK', '24 KL', '', 'Active', '2026-09-23 02:26:59.981', '2026-09-23 02:26:59.981'),
('cmudhfk7i009gofxrsltgl1ds', 'B9504TEI', 'B9504TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.983', '2026-09-23 02:26:59.983'),
('cmudhfk7k009hofxrat0hk57h', 'B9505TEI', 'B9505TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.984', '2026-09-23 02:26:59.984'),
('cmudhfk7m009iofxrs76s2iq4', 'B9520TEI', 'B9520TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.987', '2026-09-23 02:26:59.987'),
('cmudhfk7o009jofxrpuo452zw', 'B9570SEI', 'B9570SEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.989', '2026-09-23 02:26:59.989'),
('cmudhfk7q009kofxrua1w53qn', 'B9810TEI', 'B9810TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.991', '2026-09-23 02:26:59.991'),
('cmudhfk7s009lofxrkh71qay0', 'B9811TEI', 'B9811TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.993', '2026-09-23 02:26:59.993'),
('cmudhfk7u009mofxromqycu8g', 'B9812TEI', 'B9812TEI', '24 KL', '', 'Active', '2026-09-23 02:26:59.994', '2026-09-23 02:26:59.994'),
('cmudhfk7w009nofxru2kkojyh', 'E9225YC', 'E9225YC', '24 KL', '', 'Active', '2026-09-23 02:26:59.996', '2026-09-23 02:26:59.996'),
('cmudhfk7y009oofxrxt4wp125', 'E9264YC', 'E9264YC', '24 KL', '', 'Active', '2026-09-23 02:26:59.998', '2026-09-23 02:26:59.998'),
('cmudhfk7z009pofxr4jsuxl8t', 'E9334YC', 'E9334YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.000', '2026-09-23 02:27:00.000'),
('cmudhfk81009qofxrqafbrs3x', 'E9335YC', 'E9335YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.002', '2026-09-23 02:27:00.002'),
('cmudhfk83009rofxrhf7no15x', 'E9412YC', 'E9412YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.003', '2026-09-23 02:27:00.003'),
('cmudhfk85009sofxr6tqsszau', 'E9445YC', 'E9445YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.005', '2026-09-23 02:27:00.005'),
('cmudhfk87009tofxr5coey4po', 'E9450YC', 'E9450YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.007', '2026-09-23 02:27:00.007'),
('cmudhfk88009uofxr758vbv8u', 'E9453YC', 'E9453YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.009', '2026-09-23 02:27:00.009'),
('cmudhfk8a009vofxr22unmfi6', 'E9493YC', 'E9493YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.010', '2026-09-23 02:27:00.010'),
('cmudhfk8c009wofxrxcc12ucm', 'E9495YC', 'E9495YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.012', '2026-09-23 02:27:00.012'),
('cmudhfk8d009xofxronf9xgxx', 'E9496YC', 'E9496YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.014', '2026-09-23 02:27:00.014'),
('cmudhfk8f009yofxr4dr2uwgq', 'E9512YC', 'E9512YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.016', '2026-09-23 02:27:00.016'),
('cmudhfk8i009zofxrkzg02bhf', 'E9535YC', 'E9535YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.018', '2026-09-23 02:27:00.018'),
('cmudhfk8k00a0ofxrtcxiinef', 'E9536YC', 'E9536YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.020', '2026-09-23 02:27:00.020'),
('cmudhfk8m00a1ofxrgihvclzl', 'E9537YC', 'E9537YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.022', '2026-09-23 02:27:00.022'),
('cmudhfk8o00a2ofxrp2zbukdk', 'E9542YC', 'E9542YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.024', '2026-09-23 02:27:00.024'),
('cmudhfk8q00a3ofxrdkpph0ab', 'E9547YC', 'E9547YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.026', '2026-09-23 02:27:00.026'),
('cmudhfk8s00a4ofxrkq0i5sbf', 'E9552YC', 'E9552YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.029', '2026-09-23 02:27:00.029'),
('cmudhfk8u00a5ofxr7qe1nle1', 'E9554YC', 'E9554YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.031', '2026-09-23 02:27:00.031'),
('cmudhfk8w00a6ofxr5m5j1r5x', 'E9556YC', 'E9556YC', '24 KL', '', 'Active', '2026-09-23 02:27:00.033', '2026-09-23 02:27:00.033'),
('cmudhfk8y00a7ofxrophhn5xg', 'G9214OA', 'G9214OA', '24 KL', '', 'Active', '2026-09-23 02:27:00.034', '2026-09-23 02:27:00.034'),
('cmudhfk9000a8ofxr445vq201', 'G9532OA', 'G9532OA', '24 KL', '', 'Active', '2026-09-23 02:27:00.037', '2026-09-23 02:27:00.037'),
('cmudhfk9200a9ofxrt2awuc8i', 'G9534OA', 'G9534OA', '24 KL', '', 'Active', '2026-09-23 02:27:00.039', '2026-09-23 02:27:00.039'),
('cmudhfk9400aaofxr5k60z5nh', 'H9677OF', 'H9677OF', '24 KL', '', 'Active', '2026-09-23 02:27:00.041', '2026-09-23 02:27:00.041'),
('cmudhfk9600abofxrsi5ag5to', 'H9698OF', 'H9698OF', '24 KL', '', 'Active', '2026-09-23 02:27:00.042', '2026-09-23 02:27:00.042'),
('cmudhfk9700acofxr1v2idnmh', 'H9739OH', 'H9739OH', '24 KL', '', 'Active', '2026-09-23 02:27:00.044', '2026-09-23 02:27:00.044'),
('cmudhfk9900adofxr0cttq2mo', 'H9740OH', 'H9740OH', '24 KL', '', 'Active', '2026-09-23 02:27:00.046', '2026-09-23 02:27:00.046'),
('cmudhfk9b00aeofxrqg3be4dg', 'N8864UG', 'N8864UG', '24 KL', '', 'Active', '2026-09-23 02:27:00.048', '2026-09-23 02:27:00.048'),
('cmudhfk9d00afofxrh6f3lp9t', 'N8869UF', 'N8869UF', '24 KL', '', 'Active', '2026-09-23 02:27:00.049', '2026-09-23 02:27:00.049'),
('cmudhfk9f00agofxrqqjcl5q6', 'N9369UI', 'N9369UI', '24 KL', '', 'Active', '2026-09-23 02:27:00.052', '2026-09-23 02:27:00.052'),
('cmudhfk9h00ahofxr9wm0c7d8', 'N9657UI', 'N9657UI', '24 KL', '', 'Active', '2026-09-23 02:27:00.054', '2026-09-23 02:27:00.054'),
('cmudhfk9j00aiofxr9vzd9t07', 'R8435CM', 'R8435CM', '24 KL', '', 'Active', '2026-09-23 02:27:00.056', '2026-09-23 02:27:00.056'),
('cmudhfk9l00ajofxrtcmpdrgg', 'R9237IH', 'R9237IH', '24 KL', '', 'Active', '2026-09-23 02:27:00.058', '2026-09-23 02:27:00.058'),
('cmudhfk9n00akofxrql5mpdy6', 'R9238IH', 'R9238IH', '24 KL', '', 'Active', '2026-09-23 02:27:00.060', '2026-09-23 02:27:00.060'),
('cmudhfk9p00alofxr6p6pbiu2', 'R9564B', 'R9564B', '24 KL', '', 'Active', '2026-09-23 02:27:00.061', '2026-09-23 02:27:00.061'),
('cmudhfk9r00amofxrs0f3ty0j', 'AA8860OF', 'AA8860OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.063', '2026-09-23 02:27:00.063'),
('cmudhfk9t00anofxr0o3h26wa', 'B9022SFV', 'B9022SFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.065', '2026-09-23 02:27:00.065'),
('cmudhfk9v00aoofxroay2o05n', 'B9061SFV', 'B9061SFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.067', '2026-09-23 02:27:00.067'),
('cmudhfk9w00apofxrvnxmmgza', 'B9223SFV', 'B9223SFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.069', '2026-09-23 02:27:00.069'),
('cmudhfk9y00aqofxr4c8k5e4e', 'B9234SFV', 'B9234SFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.070', '2026-09-23 02:27:00.070'),
('cmudhfka000arofxrduj46yqn', 'B9246SFV', 'B9246SFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.072', '2026-09-23 02:27:00.072'),
('cmudhfka100asofxrkec7ijgp', 'B9298SFW', 'B9298SFW', '16 KL', '', 'Active', '2026-09-23 02:27:00.074', '2026-09-23 02:27:00.074'),
('cmudhfka300atofxrbcttsp5d', 'B9299SFW', 'B9299SFW', '16 KL', '', 'Active', '2026-09-23 02:27:00.076', '2026-09-23 02:27:00.076'),
('cmudhfka500auofxr2h3nwr4v', 'B9300TFV', 'B9300TFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.077', '2026-09-23 02:27:00.077'),
('cmudhfka700avofxrbmr3vft6', 'B9376TFV', 'B9376TFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.080', '2026-09-23 02:27:00.080'),
('cmudhfka900awofxrf2ln6ajy', 'B9378TFV', 'B9378TFV', '16 KL', '', 'Active', '2026-09-23 02:27:00.081', '2026-09-23 02:27:00.081'),
('cmudhfkab00axofxrzeu5ddoi', 'H8481OH', 'H8481OH', '16 KL', '', 'Active', '2026-09-23 02:27:00.083', '2026-09-23 02:27:00.083'),
('cmudhfkac00ayofxrustyds73', 'H9013OH', 'H9013OH', '16 KL', '', 'Active', '2026-09-23 02:27:00.085', '2026-09-23 02:27:00.085'),
('cmudhfkae00azofxrttldkybv', 'H9155OF', 'H9155OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.086', '2026-09-23 02:27:00.086'),
('cmudhfkag00b0ofxrv85nupyw', 'H9390OF', 'H9390OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.089', '2026-09-23 02:27:00.089'),
('cmudhfkai00b1ofxr8ojz9a4q', 'H9391OF', 'H9391OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.090', '2026-09-23 02:27:00.090'),
('cmudhfkak00b2ofxrtspd1qfq', 'H9392OF', 'H9392OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.092', '2026-09-23 02:27:00.092'),
('cmudhfkal00b3ofxruwj9lh6r', 'H9536OH', 'H9536OH', '16 KL', '', 'Active', '2026-09-23 02:27:00.094', '2026-09-23 02:27:00.094'),
('cmudhfkan00b4ofxrp36lhmsg', 'H9771OF', 'H9771OF', '16 KL', '', 'Active', '2026-09-23 02:27:00.096', '2026-09-23 02:27:00.096'),
('cmudhfkap00b5ofxrc5uheabb', 'N8021UEA', 'N8021UEA', '16 KL', '', 'Active', '2026-09-23 02:27:00.098', '2026-09-23 02:27:00.098'),
('cmudhfkar00b6ofxrq4hgwsfp', 'N8054UEA', 'N8054UEA', '16 KL', '', 'Active', '2026-09-23 02:27:00.099', '2026-09-23 02:27:00.099'),
('cmudhfkat00b7ofxrzouo8sjm', 'N8533UG', 'N8533UG', '16 KL', '', 'Active', '2026-09-23 02:27:00.101', '2026-09-23 02:27:00.101'),
('cmudhfkav00b8ofxr9x2nj7d6', 'N9086UI', 'N9086UI', '16 KL', '', 'Active', '2026-09-23 02:27:00.103', '2026-09-23 02:27:00.103'),
('cmudhfkaw00b9ofxr4v9h5rxu', 'N9326UI', 'N9326UI', '16 KL', '', 'Active', '2026-09-23 02:27:00.105', '2026-09-23 02:27:00.105'),
('cmudhfkay00baofxr330uqpb9', 'N9405UH', 'N9405UH', '16 KL', '', 'Active', '2026-09-23 02:27:00.106', '2026-09-23 02:27:00.106'),
('cmudhfkb000bbofxrv1r6cpn3', 'N9865UJ', 'N9865UJ', '16 KL', '', 'Active', '2026-09-23 02:27:00.109', '2026-09-23 02:27:00.109'),
('cmudhfkb200bcofxr22wkfhr9', 'R8114K', 'R8114K', '16 KL', '', 'Active', '2026-09-23 02:27:00.111', '2026-09-23 02:27:00.111'),
('cmudhfkb400bdofxr8zxdoh81', 'R9674B', 'R9674B', '16 KL', '', 'Active', '2026-09-23 02:27:00.113', '2026-09-23 02:27:00.113'),
('cmudhfkb600beofxrt0es639d', 'R9675B', 'R9675B', '16 KL', '', 'Active', '2026-09-23 02:27:00.115', '2026-09-23 02:27:00.115'),
('cmudhfkb800bfofxriekxm92a', 'R9839BR', 'R9839BR', '16 KL', '', 'Active', '2026-09-23 02:27:00.117', '2026-09-23 02:27:00.117'),
('cmudhfkba00bgofxr2wwughzd', 'B9697SFV', 'B9697SFV', '8 KL', '', 'Active', '2026-09-23 02:27:00.118', '2026-09-23 02:27:00.118'),
('cmudhfkbc00bhofxrtcda1gmt', 'H8428OH', 'H8428OH', '8 KL', '', 'Active', '2026-09-23 02:27:00.120', '2026-09-23 02:27:00.120'),
('cmudhfkbe00biofxribrp5ndi', 'N8641UH', 'N8641UH', '8 KL', '', 'Active', '2026-09-23 02:27:00.122', '2026-09-23 02:27:00.122');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `checklistitem`
--
ALTER TABLE `checklistitem`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `handover`
--
ALTER TABLE `handover`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Handover_userId_fkey` (`userId`);

--
-- Indexes for table `handoveritem`
--
ALTER TABLE `handoveritem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `HandoverItem_handoverId_fkey` (`handoverId`);

--
-- Indexes for table `issue`
--
ALTER TABLE `issue`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Issue_handoverId_key` (`handoverId`);

--
-- Indexes for table `photo`
--
ALTER TABLE `photo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Photo_handoverId_fkey` (`handoverId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_username_key` (`username`);

--
-- Indexes for table `vehicle`
--
ALTER TABLE `vehicle`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Vehicle_noPolisi_key` (`noPolisi`),
  ADD UNIQUE KEY `Vehicle_barcode_key` (`barcode`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
