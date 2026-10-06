import gc
import io
import logging
import time
from dataclasses import dataclass
from typing import Any, Optional

import fitz
import numpy as np
import paddleocr
from PIL import Image, ImageOps
from paddleocr import PaddleOCR

from app.config import settings
from app.schemas import OCRProcessResponse, ProcessingMetrics

logger = logging.getLogger("ocr.processor")
ocr_engine: Optional[PaddleOCR] = None


@dataclass
class PageText:
    text: str
    confidences: list[float]
    used_ocr: bool
    retries: int = 0


def get_ocr_engine() -> PaddleOCR:
    global ocr_engine
    if ocr_engine is None:
        logger.info("ocr_engine_initializing", extra={"engine": "PaddleOCR", "language": "es"})
        ocr_engine = PaddleOCR(
            lang="es",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
        )
    return ocr_engine


def reset_ocr_engine() -> None:
    global ocr_engine
    ocr_engine = None
    gc.collect()


def _normalize_confidence(value: Any) -> Optional[float]:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    if 0 <= score <= 1:
        score *= 100
    return round(max(0.0, min(score, 100.0)), 2)


def _collect_text_scores(value: Any, texts: list[str], scores: list[float]) -> None:
    if value is None:
        return
    if hasattr(value, "json"):
        try:
            _collect_text_scores(value.json, texts, scores)
            return
        except Exception:
            pass
    if hasattr(value, "to_dict"):
        try:
            _collect_text_scores(value.to_dict(), texts, scores)
            return
        except Exception:
            pass
    if isinstance(value, dict):
        rec_texts = value.get("rec_texts") or value.get("texts")
        rec_scores = value.get("rec_scores") or value.get("scores") or []
        if isinstance(rec_texts, (list, tuple)):
            for index, text in enumerate(rec_texts):
                if text:
                    texts.append(str(text))
                    if index < len(rec_scores):
                        score = _normalize_confidence(rec_scores[index])
                        if score is not None:
                            scores.append(score)
            return
        for nested in value.values():
            _collect_text_scores(nested, texts, scores)
        return
    if isinstance(value, (list, tuple)):
        # PaddleOCR 2.x: [box, (text, score)]
        if len(value) >= 2 and isinstance(value[1], (list, tuple)) and value[1]:
            candidate = value[1]
            if isinstance(candidate[0], str):
                texts.append(candidate[0])
                if len(candidate) > 1:
                    score = _normalize_confidence(candidate[1])
                    if score is not None:
                        scores.append(score)
                return
        for nested in value:
            _collect_text_scores(nested, texts, scores)


def extract_text_and_confidences(result: Any) -> tuple[str, list[float]]:
    texts: list[str] = []
    scores: list[float] = []
    _collect_text_scores(result, texts, scores)
    return "\n".join(texts).strip(), scores


def _prepare_image(file_bytes: bytes, max_side: int) -> np.ndarray:
    with Image.open(io.BytesIO(file_bytes)) as source:
        width, height = source.size
        if width * height > settings.max_image_pixels:
            raise ValueError(
                f"La imagen excede el máximo de {settings.max_image_pixels} píxeles."
            )
        image = ImageOps.exif_transpose(source).convert("RGB")
        largest = max(image.size)
        if largest > max_side:
            ratio = max_side / float(largest)
            image = image.resize(
                (max(1, int(image.width * ratio)), max(1, int(image.height * ratio))),
                Image.Resampling.LANCZOS,
            )
        return np.asarray(image)


def run_ocr_on_image(file_bytes: bytes) -> PageText:
    for attempt, max_side in enumerate((settings.max_image_side, settings.retry_image_side)):
        try:
            image = _prepare_image(file_bytes, max_side)
            result = get_ocr_engine().predict(image)
            text, scores = extract_text_and_confidences(result)
            if not text:
                raise RuntimeError("PaddleOCR no devolvió texto reconocido.")
            return PageText(text=text, confidences=scores, used_ocr=True, retries=attempt)
        except ValueError:
            raise
        except Exception:
            logger.exception("ocr_image_attempt_failed attempt=%s", attempt + 1)
            reset_ocr_engine()
            if attempt == 1:
                raise
    raise RuntimeError("No fue posible procesar la imagen.")


def extract_text_from_pdf(file_bytes: bytes) -> tuple[list[PageText], int]:
    document = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        page_count = document.page_count
        if page_count == 0:
            raise ValueError("El PDF no contiene páginas.")
        if page_count > settings.max_pdf_pages:
            raise ValueError(
                f"El PDF excede el máximo de {settings.max_pdf_pages} páginas."
            )
        pages: list[PageText] = []
        scale = settings.pdf_render_dpi / 72.0
        for index, page in enumerate(document):
            direct_text = page.get_text("text").strip()
            if direct_text:
                pages.append(PageText(direct_text, [100.0], used_ocr=False))
                logger.info("ocr_pdf_page_direct_text page=%s", index + 1)
                continue
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            page_result = run_ocr_on_image(pixmap.tobytes("png"))
            pages.append(page_result)
            logger.info("ocr_pdf_page_image_processed page=%s", index + 1)
        return pages, page_count
    finally:
        document.close()


def process_document_bytes(file_bytes: bytes, filename: str, content_type: str) -> OCRProcessResponse:
    started = time.perf_counter()
    metrics = ProcessingMetrics(engineVersion=getattr(paddleocr, "__version__", None))
    try:
        if not file_bytes:
            raise ValueError("El archivo está vacío.")
        if len(file_bytes) > settings.max_file_size_bytes:
            raise ValueError("El archivo excede el tamaño máximo permitido.")

        normalized_type = content_type.split(";", 1)[0].strip().lower()
        if normalized_type == "application/pdf" or filename.lower().endswith(".pdf"):
            pages, metrics.pageCount = extract_text_from_pdf(file_bytes)
        elif normalized_type.startswith("image/"):
            pages = [run_ocr_on_image(file_bytes)]
        elif normalized_type == "text/plain":
            pages = [PageText(file_bytes.decode("utf-8"), [100.0], used_ocr=False)]
        else:
            raise ValueError(f"Tipo MIME no soportado: {normalized_type or 'desconocido'}.")

        metrics.ocrPageCount = sum(1 for page in pages if page.used_ocr)
        metrics.directTextPageCount = sum(1 for page in pages if not page.used_ocr)
        metrics.retryCount = sum(page.retries for page in pages)
        all_scores = [score for page in pages for score in page.confidences]
        confidence = round(sum(all_scores) / len(all_scores), 2) if all_scores else None
        raw_text = "\n\n".join(
            f"--- Página {index + 1} ---\n{page.text}" for index, page in enumerate(pages)
        ).strip()
        return OCRProcessResponse(
            success=bool(raw_text),
            processStatus="OK" if raw_text else "ERROR_OCR",
            rawText=raw_text,
            confidenceAvg=confidence,
            errorMessage=None if raw_text else "No se reconoció texto en el documento.",
            metrics=metrics,
        )
    except Exception as exc:
        logger.exception("ocr_document_failed document_name=%s", filename)
        return OCRProcessResponse(
            success=False,
            processStatus="ERROR_OCR",
            rawText=None,
            confidenceAvg=None,
            errorMessage=str(exc),
            metrics=metrics,
        )
    finally:
        metrics.processingDurationMs = round((time.perf_counter() - started) * 1000)
