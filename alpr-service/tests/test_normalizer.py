import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.normalizer import normalize_indonesian_plate, compare_plates, clean_raw_text

class TestNormalizer(unittest.TestCase):
    def test_clean_raw_text(self):
        self.assertEqual(clean_raw_text(" B-9504-TEI "), "B 9504 TEI")
        self.assertEqual(clean_raw_text("b.9376.tfv\n"), "B 9376 TFV")
        self.assertEqual(clean_raw_text("R_1234_AB!!"), "R 1234 AB")

    def test_normalize_valid_plates(self):
        formatted, clean, valid = normalize_indonesian_plate("B 9504 TEI")
        self.assertTrue(valid)
        self.assertEqual(formatted, "B 9504 TEI")
        self.assertEqual(clean, "B9504TEI")

        formatted, clean, valid = normalize_indonesian_plate("B9376TFV")
        self.assertTrue(valid)
        self.assertEqual(formatted, "B 9376 TFV")
        self.assertEqual(clean, "B9376TFV")

        formatted, clean, valid = normalize_indonesian_plate("R 1234 AB")
        self.assertTrue(valid)
        self.assertEqual(formatted, "R 1234 AB")
        self.assertEqual(clean, "R1234AB")

        formatted, clean, valid = normalize_indonesian_plate("INDONESIA B 9123 TFU 05.28")
        self.assertTrue(valid)
        self.assertEqual(formatted, "B 9123 TFU")
        self.assertEqual(clean, "B9123TFU")

    def test_normalize_invalid_or_incomplete(self):
        formatted, clean, valid = normalize_indonesian_plate("HELLO WORLD")
        self.assertFalse(valid)

        formatted, clean, valid = normalize_indonesian_plate("")
        self.assertFalse(valid)
        self.assertIsNone(clean)

    def test_compare_plates(self):
        self.assertTrue(compare_plates("B 9504 TEI", "B9504TEI"))
        self.assertTrue(compare_plates("b 9504 tei", "B 9504 TEI"))
        self.assertFalse(compare_plates("B 9504 TEI", "B 9376 TFV"))
        self.assertFalse(compare_plates(None, "B 9504 TEI"))
        self.assertFalse(compare_plates("B 9504 TEI", None))

if __name__ == '__main__':
    unittest.main()
