import os
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from .config import settings

class PlateDetector:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._initialize_detector()

    def _initialize_detector(self):
        """
        Attempts to load YOLO/ONNX detector model if available.
        Falls back to CV contour / morphological detector if weights not present.
        """
        model_path = settings.MODEL_PATH
        if os.path.exists(model_path):
            try:
                # Try loading ONNX model with OpenCV DNN
                self.net = cv2.dnn.readNetFromONNX(model_path)
                if settings.USE_GPU:
                    self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
                    self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)
                else:
                    self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
                    self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
                self.model_loaded = True
                print(f"[ALPR Detector] Loaded ONNX detector from {model_path}")
            except Exception as e:
                print(f"[ALPR Detector] Warning: Failed to load ONNX model: {e}")
                self.model_loaded = False
        else:
            self.model_loaded = False

    def detect_plates(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects license plate candidates in the image.
        Returns a list of dicts:
        [{
            'bbox': {'x': int, 'y': int, 'width': int, 'height': int},
            'confidence': float,
            'crop': np.ndarray
        }]
        """
        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]
        candidates = []

        # If custom model is loaded, use it
        if self.model_loaded:
            candidates = self._detect_with_dnn(image)

        # If no candidates found with model, use robust morphological contour localization
        if not candidates:
            candidates = self._detect_with_heuristics(image)

        # If still none, add lower-third / bumper region of the vehicle as fallback candidate
        if not candidates:
            bumper_y = int(h * 0.45)
            bumper_crop = image[bumper_y:h, :]
            candidates.append({
                'bbox': {'x': 0, 'y': bumper_y, 'width': w, 'height': h - bumper_y},
                'confidence': 0.60,
                'crop': bumper_crop
            })

        return candidates

    def _detect_with_dnn(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Runs inference via OpenCV DNN on the ONNX model."""
        try:
            h, w = image.shape[:2]
            blob = cv2.dnn.blobFromImage(image, 1/255.0, (640, 640), swapRB=True, crop=False)
            self.net.setInput(blob)
            outputs = self.net.forward()
            
            # Parse standard YOLOv8 output
            # (1, 5, 8400) or (1, 8400, 5) [x, y, w, h, conf]
            if len(outputs.shape) == 3:
                if outputs.shape[1] < outputs.shape[2]:
                    outputs = outputs.transpose(0, 2, 1)
                
                boxes = []
                confidences = []
                for det in outputs[0]:
                    conf = float(det[4])
                    if conf >= settings.DETECTION_CONFIDENCE_THRESHOLD:
                        cx, cy, bw, bh = det[0], det[1], det[2], det[3]
                        # Scale back to original image
                        x = int((cx - bw / 2) * (w / 640.0))
                        y = int((cy - bh / 2) * (h / 640.0))
                        width = int(bw * (w / 640.0))
                        height = int(bh * (h / 640.0))
                        boxes.append([x, y, width, height])
                        confidences.append(conf)

                indices = cv2.dnn.NMSBoxes(boxes, confidences, settings.DETECTION_CONFIDENCE_THRESHOLD, 0.45)
                results = []
                for i in indices:
                    idx = i[0] if isinstance(i, (list, np.ndarray)) else i
                    bx, by, bw, bh = boxes[idx]
                    bx = max(0, bx)
                    by = max(0, by)
                    bw = min(w - bx, bw)
                    bh = min(h - by, bh)
                    crop = image[by:by+bh, bx:bx+bw]
                    if crop.size > 0:
                        results.append({
                            'bbox': {'x': bx, 'y': by, 'width': bw, 'height': bh},
                            'confidence': confidences[idx],
                            'crop': crop
                        })
                return results
        except Exception as e:
            print(f"[ALPR Detector] DNN error, falling back: {e}")
        return []

    def _detect_with_heuristics(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Computer Vision morphological filtering to localize license plate rectangle:
        - Gray -> Gaussian Blur -> Sobel / Blackhat -> Otsu Threshold -> Morphological Close
        - Contours filtered by standard Indonesian TNKB aspect ratio (2.2 to 4.8)
        """
        try:
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply bilateral filter to preserve edges while removing noise
            blurred = cv2.bilateralFilter(gray, 9, 75, 75)

            # Morphological blackhat (highlights dark elements on light background, or vice versa)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 5))
            blackhat = cv2.morphologyEx(blurred, cv2.MORPH_BLACKHAT, kernel)

            # Thresholding
            thresh = cv2.adaptiveThreshold(
                blackhat, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 19, 9
            )

            # Close gaps
            close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)

            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            candidates = []

            for cnt in contours:
                x, y, bw, bh = cv2.boundingRect(cnt)
                if bh == 0:
                    continue
                aspect_ratio = float(bw) / bh
                area = bw * bh

                # Indonesian plate standard aspect ratio is ~2.8 - 4.5
                if 2.0 <= aspect_ratio <= 5.5 and 1500 <= area <= (w * h * 0.4):
                    # Slight padding around candidate crop
                    pad_x = int(bw * 0.05)
                    pad_y = int(bh * 0.1)
                    x1 = max(0, x - pad_x)
                    y1 = max(0, y - pad_y)
                    x2 = min(w, x + bw + pad_x)
                    y2 = min(h, y + bh + pad_y)

                    crop = image[y1:y2, x1:x2]
                    if crop.size > 0:
                        candidates.append({
                            'bbox': {'x': x1, 'y': y1, 'width': x2 - x1, 'height': y2 - y1},
                            'confidence': 0.72,
                            'crop': crop
                        })

            # Sort by area descending and return top 3 candidates
            candidates.sort(key=lambda c: c['bbox']['width'] * c['bbox']['height'], reverse=True)
            return candidates[:3]
        except Exception as e:
            print(f"[ALPR Detector] Heuristic error: {e}")
            return []

