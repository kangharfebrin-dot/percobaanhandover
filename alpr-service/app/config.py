import os
from pydantic import BaseModel

class Settings(BaseModel):
    SERVICE_NAME: str = "Pertamina DIGI Handover ALPR Service"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("ALPR_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("ALPR_PORT", "8000"))
    
    # Confidence thresholds
    DETECTION_CONFIDENCE_THRESHOLD: float = float(os.getenv("ALPR_DETECTION_THRESHOLD", "0.60"))
    OCR_CONFIDENCE_THRESHOLD: float = float(os.getenv("ALPR_OCR_THRESHOLD", "0.65"))
    MIN_ACCEPTABLE_CONFIDENCE: float = float(os.getenv("ALPR_MIN_CONFIDENCE", "0.55"))

    # Model configuration
    MODEL_TYPE: str = os.getenv("ALPR_MODEL_TYPE", "paddleocr_yolo")
    MODEL_PATH: str = os.getenv("ALPR_MODEL_PATH", "models/license_plate_yolo.onnx")
    USE_GPU: bool = os.getenv("ALPR_USE_GPU", "false").lower() in ("true", "1", "yes")

settings = Settings()

