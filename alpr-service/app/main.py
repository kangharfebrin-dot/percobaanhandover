import time
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .config import settings
from .schemas import PlateRecognitionResponse, HealthCheckResponse, BoundingBox
from .detector import PlateDetector
from .ocr import PlateOCR
from .normalizer import normalize_indonesian_plate, compare_plates, clean_raw_text

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="Microservice deteksi dan pembacaan plat nomor kendaraan tangki (ALPR) Pertamina DIGI Handover."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singleton detector & OCR instances
detector = PlateDetector()
ocr = PlateOCR()

@app.get("/health", response_model=HealthCheckResponse)
def health_check():
    return HealthCheckResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        gpu_available=settings.USE_GPU,
        models_loaded=True
    )

@app.post("/v1/alpr/recognize", response_model=PlateRecognitionResponse)
async def recognize_plate(
    file: UploadFile = File(...),
    expected_plate: Optional[str] = Form(None),
    side: Optional[str] = Form(None)
):
    start_time = time.time()

    # 1. Validate file format
    if not file.content_type or not file.content_type.startswith("image/"):
        return PlateRecognitionResponse(
            success=False,
            status="UNREADABLE",
            side=side,
            expected_plate=expected_plate,
            error_message="Format file tidak didukung. Harap unggah file gambar yang valid (JPEG/PNG/WEBP)."
        )

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return PlateRecognitionResponse(
                success=False,
                status="UNREADABLE",
                side=side,
                expected_plate=expected_plate,
                error_message="Gagal membaca buffer gambar."
            )
    except Exception as e:
        return PlateRecognitionResponse(
            success=False,
            status="SERVICE_ERROR",
            side=side,
            expected_plate=expected_plate,
            error_message=f"Kesalahan memproses payload gambar: {str(e)}"
        )

    # 2. Plate Detection Pipeline
    candidates = detector.detect_plates(img)
    best_candidate = None
    best_detected_text = ""
    best_formatted_plate = None
    best_clean_plate = None
    best_conf = 0.0
    is_valid_format = False
    all_raw_texts = []
    best_bbox = None

    for cand in candidates:
        crop = cand.get('crop')
        det_conf = cand.get('confidence', 0.5)
        bbox = cand.get('bbox')

        raw_text, ocr_conf, raw_list = ocr.read_plate(crop)
        if raw_list:
            all_raw_texts.extend(raw_list)

        if raw_text:
            formatted, clean, valid_fmt = normalize_indonesian_plate(raw_text)
            overall_conf = (det_conf * 0.4) + (ocr_conf * 0.6)

            if valid_fmt:
                best_candidate = cand
                best_detected_text = raw_text
                best_formatted_plate = formatted
                best_clean_plate = clean
                best_conf = overall_conf
                is_valid_format = True
                best_bbox = bbox
                break
            elif overall_conf > best_conf and clean:
                best_candidate = cand
                best_detected_text = raw_text
                best_formatted_plate = formatted
                best_clean_plate = clean
                best_conf = overall_conf
                is_valid_format = valid_fmt
                best_bbox = bbox

    # 3. Evaluate Status
    matches_expected = None
    status_result = "UNREADABLE"

    if best_clean_plate:
        if expected_plate:
            matches_expected = compare_plates(best_clean_plate, expected_plate)
            if matches_expected and best_conf >= settings.MIN_ACCEPTABLE_CONFIDENCE:
                status_result = "MATCH"
            elif not matches_expected and is_valid_format and best_conf >= settings.MIN_ACCEPTABLE_CONFIDENCE:
                status_result = "MISMATCH"
            else:
                status_result = "UNREADABLE" if best_conf < settings.MIN_ACCEPTABLE_CONFIDENCE else "MISMATCH"
        else:
            status_result = "MATCH" if (is_valid_format and best_conf >= settings.MIN_ACCEPTABLE_CONFIDENCE) else "UNREADABLE"
    else:
        status_result = "UNREADABLE"

    elapsed_ms = (time.time() - start_time) * 1000.0

    parsed_bbox = None
    if best_bbox:
        parsed_bbox = BoundingBox(
            x=int(best_bbox['x']),
            y=int(best_bbox['y']),
            width=int(best_bbox['width']),
            height=int(best_bbox['height'])
        )

    return PlateRecognitionResponse(
        success=True,
        status=status_result,
        detected_plate=best_formatted_plate or best_detected_text or None,
        normalized_plate=best_clean_plate,
        expected_plate=expected_plate,
        confidence=round(best_conf, 4),
        detection_confidence=round(best_candidate.get('confidence', 0.0), 4) if best_candidate else 0.0,
        ocr_confidence=round(best_conf, 4),
        is_valid_indonesian_format=is_valid_format,
        matches_expected=matches_expected,
        bounding_box=parsed_bbox,
        processing_time_ms=round(elapsed_ms, 2),
        model_info=f"{detector.__class__.__name__}+{ocr.engine_type}",
        side=side,
        raw_ocr_texts=all_raw_texts
    )

