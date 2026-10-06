import hmac
import os


def processing_access_status(provided: str | None) -> int | None:
    expected = os.getenv("OCR_INTERNAL_API_KEY", "")
    if not expected:
        return 503
    if not provided or not hmac.compare_digest(provided.encode(), expected.encode()):
        return 401
    return None
