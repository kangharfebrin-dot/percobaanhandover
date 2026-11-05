from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: int = Field(..., description="Top-left X coordinate")
    y: int = Field(..., description="Top-left Y coordinate")
    width: int = Field(..., description="Bounding box width")
    height: int = Field(..., description="Bounding box height")

class PlateRecognitionResponse(BaseModel):
    success: bool
    status: str = Field(..., description="MATCH, MISMATCH, UNREADABLE, or SERVICE_ERROR")
    detected_plate: Optional[str] = None
    normalized_plate: Optional[str] = None
    expected_plate: Optional[str] = None
    confidence: float = 0.0
    detection_confidence: float = 0.0
    ocr_confidence: float = 0.0
    is_valid_indonesian_format: bool = False
    matches_expected: Optional[bool] = None
    bounding_box: Optional[BoundingBox] = None
    processing_time_ms: float = 0.0
    model_info: str = "YOLO+PaddleOCR v1.0"
    side: Optional[str] = None
    raw_ocr_texts: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    gpu_available: bool
    models_loaded: bool

