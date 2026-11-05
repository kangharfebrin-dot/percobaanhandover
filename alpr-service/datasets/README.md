# Dataset Manajemen Plat Nomor Kendaraan (ALPR) — DIGI Handover

Direktori ini digunakan untuk mengelola data gambar dan anotasi plat nomor kendaraan Indonesia (TNKB) untuk pelatihan detektor YOLO serta evaluasi pembacaan karakter PaddleOCR.

---

## 1. Struktur Direktori

```text
alpr-service/datasets/
├── raw/
│   ├── indonesia_lighting/       # Dataset variasi pencahayaan & sudut (train: 393, valid: 84, test: 84)
│   ├── indo_alpr/                # Dataset plat nomor Indonesia skala besar (train: 1416, test: 30)
│   └── icvlpr/                   # Slot untuk dataset eksternal/lapangan lainnya
│
├── processed/
│   └── license_plate/
│       ├── images/
│       │   ├── train/
│       │   ├── val/
│       │   └── test/
│       └── labels/
│           ├── train/
│           ├── val/
│           └── test/
│
└── README.md
```

---

## 2. Rincian Dataset Raw

### A. `indonesia_lighting`
- **Sumber:** Roboflow Universe (`plat-nomor-bpqge` v3)
- **Lisensi:** CC BY 4.0
- **Total Gambar & Anotasi:**
  - `train`: 393 pasang file (`.jpg` dan `.txt`)
  - `valid`: 84 pasang file
  - `test`: 84 pasang file
- **Karakteristik:** Variasi pencahayaan tajam, minim cahaya (malam/bayangan), pantulan lampu flash, dan sudut miring.
- **Kelas:** `0: number-plate` (1 kelas tunggal)
- **Format Label:** YOLO Normalized Bounding Box (`<class_id> <x_center> <y_center> <width> <height>`)

### B. `indo_alpr`
- **Sumber:** Roboflow Universe (`indonesian-license-plates` v1)
- **Lisensi:** CC BY 4.0
- **Total Gambar & Anotasi:**
  - `train`: 1.416 pasang file
  - `test`: 30 pasang file
- **Karakteristik:** Variasi armada mobil, truk, dan tangki berplat hitam, kuning, putih di jalanan Indonesia.
- **Kelas:** `0: plate`

---

## 3. Konfigurasi `data.yaml` untuk Training YOLO

Path absolut yang direkomendasikan pada Windows:

```yaml
path: E:/Magang/DIGIHandover/alpr-service/datasets/raw/indonesia_lighting
train: train/images
val: valid/images
test: test/images

nc: 1
names:
  0: Number-plate
```

