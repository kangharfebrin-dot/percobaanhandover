# Automatic License Plate Recognition (ALPR) Service

Pertamina DIGI Handover — Terminal BBM Cilacap

Layanan microservice cerdas berbasis Python FastAPI untuk mendeteksi dan mengenali plat nomor kendaraan tangki (TNKB Indonesia) dari foto fisik armada (Depan dan Belakang).

---

## 1. Arsitektur & Teknologi

- **Framework:** FastAPI + Uvicorn
- **Deteksi Plat:** YOLO License Plate Detector (ONNX / PyTorch) dengan fallback Heuristic Contour Filtering OpenCV
- **OCR:** PaddleOCR / EasyOCR pipeline dengan preprocessing CLAHE
- **Normalizer:** Algoritma pembersihan dan pemformatan TNKB Indonesia (`^([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})$`)
- **Port Internal:** `8000` (hanya diakses oleh backend Express.js, tidak diekspos ke internet publik)

---

## 2. Status Output ALPR

1. **`MATCH`**: Nomor plat terbaca jelas dan cocok persis dengan nomor polisi database kendaraan hasil scan QR.
2. **`MISMATCH`**: Nomor plat terbaca tetapi **berbeda** dari nomor polisi resmi database.
3. **`UNREADABLE`**: Plat tidak terdeteksi, kotor, atau confidence di bawah ambang batas minimum.
4. **`SERVICE_UNAVAILABLE`**: Layanan AI sedang tidak tersedia atau timeout.
5. **`MANUAL_OVERRIDE`**: Hasil verifikasi manual yang di-override oleh Pengawas atau Admin.

---

## 3. Menjalankan Service

### Secara Lokal (Python Virtualenv)

```bash
cd alpr-service
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Secara Docker Container

```bash
docker build -t pertamina-alpr-service:latest -f Dockerfile .
docker run -d --name pertamina_alpr -p 8000:8000 pertamina-alpr-service:latest
```

---

## 4. Endpoint API

### `GET /health`

Mengecek status kesehatan microservice.

```json
{
  "status": "healthy",
  "service": "Pertamina DIGI Handover ALPR Service",
  "version": "1.0.0",
  "gpu_available": false,
  "models_loaded": true
}
```

### `POST /v1/alpr/recognize`

Menganalisis foto dan membandingkannya dengan nomor polisi target.

- **Form Data**:
  - `file`: File gambar (multipart/form-data)
  - `expected_plate`: Nomor polisi target (contoh: `B 9504 TEI`)
  - `side`: Sisi foto (`FRONT` atau `BACK`)

**Response:**

```json
{
  "success": true,
  "status": "MATCH",
  "detected_plate": "B 9504 TEI",
  "normalized_plate": "B9504TEI",
  "expected_plate": "B 9504 TEI",
  "confidence": 0.885,
  "detection_confidence": 0.912,
  "ocr_confidence": 0.858,
  "is_valid_indonesian_format": true,
  "matches_expected": true,
  "bounding_box": {
    "x": 120,
    "y": 280,
    "width": 380,
    "height": 130
  },
  "processing_time_ms": 142.5,
  "model_info": "PlateDetector+paddleocr",
  "side": "FRONT",
  "raw_ocr_texts": ["B", "9504", "TEI"]
}
```

---

## 5. Menjalankan Pengujian (Automated Tests)

```bash
cd alpr-service
python -m unittest discover -s tests
```
