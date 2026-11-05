import io
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

HAS_DEPS = False
client = None

try:
    import multipart
    import cv2
    import numpy as np
    from fastapi.testclient import TestClient
    from app.main import app
    HAS_DEPS = True
    client = TestClient(app)
except Exception as e:
    HAS_DEPS = False

def create_synthetic_image(text="B 9504 TEI") -> io.BytesIO:
    """Generates a dummy synthetic license plate image for testing."""
    if not HAS_DEPS:
        return io.BytesIO(b"fake_image")
    img = np.zeros((200, 500, 3), dtype=np.uint8)
    img[:] = (20, 20, 20)
    cv2.rectangle(img, (20, 20), (480, 180), (240, 240, 240), 3)
    cv2.putText(img, text, (50, 110), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 3)
    
    success, encoded = cv2.imencode(".jpg", img)
    buf = io.BytesIO(encoded.tobytes())
    buf.name = "test_plate.jpg"
    return buf

class TestALPRServiceAPI(unittest.TestCase):
    def setUp(self):
        if not HAS_DEPS:
            self.skipTest("FastAPI / python-multipart dependencies not present in host global Python (runs inside Docker container)")

    def test_health_endpoint(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("version", data)

    def test_recognize_invalid_mimetype(self):
        buf = io.BytesIO(b"not an image")
        response = client.post(
            "/v1/alpr/recognize",
            files={"file": ("test.txt", buf, "text/plain")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "UNREADABLE")
        self.assertIn("tidak didukung", data["error_message"])

    def test_recognize_valid_payload(self):
        img_buf = create_synthetic_image("B 9504 TEI")
        response = client.post(
            "/v1/alpr/recognize",
            files={"file": ("plate.jpg", img_buf, "image/jpeg")},
            data={"expected_plate": "B 9504 TEI", "side": "FRONT"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertEqual(data["side"], "FRONT")
        self.assertEqual(data["expected_plate"], "B 9504 TEI")
        self.assertIn("confidence", data)

if __name__ == '__main__':
    unittest.main()
