import unittest
from unittest.mock import patch
from app.security import processing_access_status

class ProcessingAccessTests(unittest.TestCase):
    def test_missing_configuration_fails_closed(self):
        with patch.dict("os.environ", {"OCR_INTERNAL_API_KEY": ""}):
            self.assertEqual(processing_access_status("anything"), 503)
    def test_missing_or_incorrect_secret_is_denied(self):
        with patch.dict("os.environ", {"OCR_INTERNAL_API_KEY": "test-secret"}):
            for value in (None, "", "wrong", "no-ascii-?"):
                self.assertEqual(processing_access_status(value), 401)
    def test_backend_secret_is_allowed(self):
        with patch.dict("os.environ", {"OCR_INTERNAL_API_KEY": "test-secret"}):
            self.assertIsNone(processing_access_status("test-secret"))

class ProcessingMiddlewareTests(unittest.IsolatedAsyncioTestCase):
    async def test_processing_auth_runs_before_body_and_handler(self):
        from app.main import request_logging
        from starlette.requests import Request
        from starlette.responses import JSONResponse
        reached = []
        async def handler(request):
            reached.append(True)
            return JSONResponse({"ok": True})
        for key, expected_status in [(None, 401), ("wrong", 401), ("test-secret", 200)]:
            headers = [] if key is None else [(b"x-ocr-api-key", key.encode())]
            request = Request({"type": "http", "method": "POST", "path": "/process", "headers": headers, "query_string": b""})
            with patch.dict("os.environ", {"OCR_INTERNAL_API_KEY": "test-secret"}):
                response = await request_logging(request, handler)
            self.assertEqual(response.status_code, expected_status)
        self.assertEqual(len(reached), 1)
