import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import fitz
from PIL import Image

from app.services.ocr_processor import (
    PageText,
    extract_text_and_confidences,
    extract_text_from_pdf,
    process_document_bytes,
)
from app.config import settings


class OCRProcessorTests(unittest.TestCase):
    def test_extracts_real_paddle_confidences(self):
        text, scores = extract_text_and_confidences([
            {"res": {"rec_texts": ["Factura", "Total 10.00"], "rec_scores": [0.91, 0.87]}}
        ])
        self.assertEqual(text, "Factura\nTotal 10.00")
        self.assertEqual(scores, [91.0, 87.0])

    def test_extracts_every_page_from_digital_pdf(self):
        document = fitz.open()
        for label in ("Primera página", "Segunda página", "Tercera página"):
            page = document.new_page()
            page.insert_text((72, 72), label)
        pdf_bytes = document.tobytes()
        document.close()
        pages, count = extract_text_from_pdf(pdf_bytes)
        self.assertEqual(count, 3)
        self.assertEqual(len(pages), 3)
        self.assertTrue(all(not page.used_ocr for page in pages))
        self.assertIn("Tercera", pages[2].text)

    def test_scanned_pdf_processes_each_page_with_ocr(self):
        document = fitz.open()
        for _ in range(2):
            document.new_page()
        pdf_bytes = document.tobytes()
        document.close()
        fake = PageText("FACTURA\nTOTAL 10.00", [88.5], used_ocr=True)
        with patch("app.services.ocr_processor.run_ocr_on_image", return_value=fake) as mocked:
            pages, count = extract_text_from_pdf(pdf_bytes)
        self.assertEqual(count, 2)
        self.assertEqual(mocked.call_count, 2)
        self.assertTrue(all(page.used_ocr for page in pages))

    def test_invalid_image_returns_error_ocr(self):
        result = process_document_bytes(b"not-an-image", "bad.png", "image/png")
        self.assertFalse(result.success)
        self.assertEqual(result.processStatus, "ERROR_OCR")
        self.assertIsNotNone(result.errorMessage)

    def test_image_resolution_limit_is_enforced(self):
        image = Image.new("RGB", (10, 10), "white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        limited = SimpleNamespace(**{**vars(settings), "max_image_pixels": 50})
        with patch("app.services.ocr_processor.settings", limited):
            result = process_document_bytes(buffer.getvalue(), "large.png", "image/png")
        self.assertEqual(result.processStatus, "ERROR_OCR")


if __name__ == "__main__":
    unittest.main()
