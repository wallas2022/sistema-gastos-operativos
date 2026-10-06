import os
from dataclasses import dataclass


def _positive_int(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError as exc:
        raise RuntimeError(f"{name} debe ser un entero.") from exc
    if value <= 0:
        raise RuntimeError(f"{name} debe ser mayor que cero.")
    return value


@dataclass(frozen=True)
class OCRSettings:
    max_file_size_bytes: int = _positive_int("OCR_MAX_FILE_SIZE_MB", 20) * 1024 * 1024
    max_image_pixels: int = _positive_int("OCR_MAX_IMAGE_PIXELS", 40_000_000)
    max_image_side: int = _positive_int("OCR_MAX_IMAGE_SIDE", 3000)
    retry_image_side: int = _positive_int("OCR_RETRY_IMAGE_SIDE", 2200)
    max_pdf_pages: int = _positive_int("OCR_MAX_PDF_PAGES", 25)
    pdf_render_dpi: int = _positive_int("OCR_PDF_RENDER_DPI", 200)


settings = OCRSettings()

ALLOWED_MIME_TYPES = frozenset(
    value.strip().lower()
    for value in os.getenv(
        "OCR_ALLOWED_MIME_TYPES",
        "application/pdf,image/jpeg,image/png,image/webp,image/tiff,text/plain",
    ).split(",")
    if value.strip()
)
