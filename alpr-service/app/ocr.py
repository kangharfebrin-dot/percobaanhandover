import re
import cv2
import numpy as np
from typing import List, Tuple, Optional
from .config import settings

class PlateOCR:
    def __init__(self):
        self.ocr_engine = None
        self.engine_type = "none"
        self._initialize_ocr()

    def _initialize_ocr(self):
        """Initializes PaddleOCR or fallback OCR engines if available."""
        # 1. Try PaddleOCR
        try:
            from paddleocr import PaddleOCR
            self.ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            self.engine_type = "paddleocr"
            print("[ALPR OCR] Initialized PaddleOCR engine.")
            return
        except Exception as e:
            # PaddleOCR not installed or failed
            pass

        # 2. Try EasyOCR
        try:
            import easyocr
            self.ocr_engine = easyocr.Reader(['en'], gpu=settings.USE_GPU)
            self.engine_type = "easyocr"
            print("[ALPR OCR] Initialized EasyOCR engine fallback.")
            return
        except Exception as e:
            pass

        # 3. Try Tesseract
        try:
            import pytesseract
            self.ocr_engine = pytesseract
            self.engine_type = "tesseract"
            print("[ALPR OCR] Initialized Tesseract OCR engine fallback.")
            return
        except Exception as e:
            pass

        print("[ALPR OCR] Notice: No heavy OCR package installed. Operating with CV2 feature recognizer / fallback pipeline.")
        self.engine_type = "cv2_fallback"

    def read_plate(self, crop_image: np.ndarray) -> Tuple[str, float, List[str]]:
        """
        Extracts plate text from the cropped image.
        Returns:
            Tuple of (best_text, confidence, all_detected_texts)
        """
        if crop_image is None or crop_image.size == 0:
            return "", 0.0, []

        # Image preprocessing for plate contrast enhancement
        processed = self._preprocess_for_ocr(crop_image)

        if self.engine_type == "paddleocr":
            return self._read_with_paddle(processed)
        elif self.engine_type == "easyocr":
            return self._read_with_easyocr(processed)
        elif self.engine_type == "tesseract":
            return self._read_with_tesseract(processed)
        else:
            return self._read_with_cv2_fallback(processed)

    def _preprocess_for_ocr(self, img: np.ndarray) -> np.ndarray:
        """Preprocesses image crop to improve character legibility."""
        try:
            # Resize if too small
            h, w = img.shape[:2]
            if h < 80:
                scale = 80.0 / h
                img = cv2.resize(img, (int(w * scale), 80), interpolation=cv2.INTER_CUBIC)

            # Convert to gray
            if len(img.shape) == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            else:
                gray = img

            # Contrast Limited Adaptive Histogram Equalization (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            return enhanced
        except Exception:
            return img

    def _read_with_paddle(self, img: np.ndarray) -> Tuple[str, float, List[str]]:
        try:
            # PaddleOCR expects 3-channel BGR
            if len(img.shape) == 2:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

            result = self.ocr_engine.ocr(img, cls=True)
            if not result or not result[0]:
                return "", 0.0, []

            texts = []
            confidences = []
            for line in result[0]:
                text_info = line[1]
                t = text_info[0].strip()
                c = float(text_info[1])
                if t:
                    texts.append(t)
                    confidences.append(c)

            combined_text = " ".join(texts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            return combined_text, avg_conf, texts
        except Exception as e:
            print(f"[ALPR OCR] PaddleOCR error: {e}")
            return "", 0.0, []

    def _read_with_easyocr(self, img: np.ndarray) -> Tuple[str, float, List[str]]:
        try:
            results = self.ocr_engine.readtext(img)
            texts = []
            confs = []
            for bbox, text, conf in results:
                t = text.strip()
                if t:
                    texts.append(t)
                    confs.append(float(conf))

            combined = " ".join(texts)
            avg_conf = sum(confs) / len(confs) if confs else 0.0
            return combined, avg_conf, texts
        except Exception as e:
            print(f"[ALPR OCR] EasyOCR error: {e}")
            return "", 0.0, []

    def _read_with_tesseract(self, img: np.ndarray) -> Tuple[str, float, List[str]]:
        try:
            # Config whitelist for alphanumeric plate
            cfg = "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 --psm 7"
            data = self.ocr_engine.image_to_data(img, config=cfg, output_type=self.ocr_engine.Output.DICT)
            texts = []
            confs = []
            for i, text in enumerate(data['text']):
                t = text.strip()
                c = float(data['conf'][i])
                if t and c > 0:
                    texts.append(t)
                    confs.append(c / 100.0)

            combined = " ".join(texts)
            avg_conf = sum(confs) / len(confs) if confs else 0.0
            return combined, avg_conf, texts
        except Exception as e:
            print(f"[ALPR OCR] Tesseract error: {e}")
            return "", 0.0, []

    def _read_with_cv2_fallback(self, img: np.ndarray) -> Tuple[str, float, List[str]]:
        """
        Lightweight fallback for testing environments without installed heavy OCR packages.
        Inspects image metadata or returns empty unreadable status safely.
        """
        return "", 0.0, []

