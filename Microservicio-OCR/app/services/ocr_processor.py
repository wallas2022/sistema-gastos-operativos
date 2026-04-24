import io
import logging
import gc
from typing import Optional, List

import numpy as np
from PIL import Image

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

from paddleocr import PaddleOCR

from app.schemas import (
    OCRProcessResponse,
    DocumentContext,
    CurrencyContext,
    NormalizedField,
    ExtraField,
    Totals,
    LineItem,
)
from app.utils.parsers import (
    detect_country,
    detect_currency,
    detect_document_type,
    extract_amount,
    extract_simple_field,
)

logger = logging.getLogger(__name__)

ocr_engine: Optional[PaddleOCR] = None

def get_ocr_engine() -> PaddleOCR:
    global ocr_engine

    if ocr_engine is None:
        logger.info("Inicializando motor PaddleOCR...")

        ocr_engine = PaddleOCR(
            lang="es",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )

    return ocr_engine

def reset_ocr_engine():
    global ocr_engine
    ocr_engine = None
    gc.collect()


def resize_if_needed(image: Image.Image, max_side: int = 3000) -> Image.Image:
    width, height = image.size
    largest = max(width, height)

    if largest <= max_side:
        return image

    ratio = max_side / float(largest)
    new_width = int(width * ratio)
    new_height = int(height * ratio)

    logger.warning(
        f"Imagen redimensionada de {width}x{height} a {new_width}x{new_height}"
    )

    return image.resize((new_width, new_height), Image.LANCZOS)


def prepare_image_for_ocr(file_bytes: bytes, max_side: int = 3000) -> np.ndarray:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    image = resize_if_needed(image, max_side=max_side)
    return np.array(image)

def extract_text_from_ocr_result(result) -> str:
    lines: List[str] = []

    if not result:
        return ""

    for item in result:
        if hasattr(item, "json"):
            try:
                data = item.json
                if isinstance(data, dict):
                    rec_texts = data.get("rec_texts") or data.get("texts")
                    if rec_texts:
                        lines.extend([str(t) for t in rec_texts if t])
                        continue
            except Exception:
                pass

        if hasattr(item, "to_dict"):
            try:
                data = item.to_dict()
                rec_texts = data.get("rec_texts") or data.get("texts")
                if rec_texts:
                    lines.extend([str(t) for t in rec_texts if t])
                    continue
            except Exception:
                pass

        if isinstance(item, dict):
            rec_texts = item.get("rec_texts") or item.get("texts")
            if rec_texts:
                lines.extend([str(t) for t in rec_texts if t])
                continue

        if isinstance(item, list):
            for block in item:
                if not block:
                    continue

                if isinstance(block, list):
                    for line in block:
                        if not line or len(line) < 2:
                            continue

                        text_info = line[1]
                        if isinstance(text_info, (list, tuple)) and len(text_info) > 0:
                            text = text_info[0]
                            if text:
                                lines.append(str(text))

    return "\n".join(lines).strip()


def run_ocr_on_image(file_bytes: bytes) -> str:
    """
    Ejecuta OCR sobre imagen con reintento controlado.
    """
    image_np = prepare_image_for_ocr(file_bytes, max_side=3000)

    try:
        engine = get_ocr_engine()
        result = engine.predict(image_np)
        return extract_text_from_ocr_result(result)

    except Exception as e:
        logger.exception("Primer intento OCR falló. Se reiniciará el engine.")

        reset_ocr_engine()

        # Reintento con imagen aún más pequeña
        image_np = prepare_image_for_ocr(file_bytes, max_side=2200)

        try:
            engine = get_ocr_engine()
            result = engine.predict(image_np)
            return extract_text_from_ocr_result(result)
        except Exception as e2:
            logger.exception("Segundo intento OCR falló.")
            raise RuntimeError(f"Error OCR: {str(e2)}")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Intenta extraer texto directo del PDF.
    Si no encuentra, renderiza la primera página a imagen y aplica OCR.
    """
    if fitz is None:
        raise RuntimeError("PyMuPDF no está instalado. Instala pymupdf.")

    doc = fitz.open(stream=file_bytes, filetype="pdf")

    try:
        full_text = []

        for page in doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                full_text.append(page_text)

        joined = "\n".join(full_text).strip()
        if joined:
            return joined

        # fallback OCR sobre primera página
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image_bytes = pix.tobytes("png")
        return run_ocr_on_image(image_bytes)

    finally:
        doc.close()


def process_document_bytes(file_bytes: bytes, filename: str, content_type: str) -> OCRProcessResponse:
    raw_text = ""
    success = True
    process_status = "OK"
    error_message = None

    try:
        if "pdf" in content_type.lower() or filename.lower().endswith(".pdf"):
            raw_text = extract_text_from_pdf(file_bytes)
        elif content_type.lower().startswith("image/"):
            raw_text = run_ocr_on_image(file_bytes)
        else:
            try:
                raw_text = file_bytes.decode("utf-8")
            except Exception:
                raw_text = f"Documento recibido: {filename}\nTipo MIME: {content_type}"

    except Exception as e:
        logger.exception("Error general OCR")
        raw_text = f"Documento recibido: {filename}\nTipo MIME: {content_type}"
        success = False
        process_status = "ERROR_OCR"
        error_message = f"Error general OCR: {str(e)}"

    country = detect_country(raw_text)
    currency = detect_currency(raw_text)
    document_type = detect_document_type(raw_text)

    supplier_name = extract_simple_field(raw_text, ["Proveedor", "Emisor", "Razón Social", "Nombre"])
    tax_identifier = extract_simple_field(raw_text, ["NIT", "RTN", "RUC", "NRC", "Cédula Jurídica"])
    document_number = extract_simple_field(raw_text, ["Factura No", "Número", "No. Documento", "Serie", "No."])
    document_date = extract_simple_field(raw_text, ["Fecha", "Fecha Emisión", "Fecha de Emisión"])

    subtotal = extract_amount(raw_text, ["Subtotal", "Sub-Total"])
    tax = extract_amount(raw_text, ["IVA", "Impuesto", "Tax"])
    total = extract_amount(raw_text, ["Total", "TOTAL A PAGAR", "Total a pagar"])

    normalized_fields = []

    if supplier_name:
        normalized_fields.append(
            NormalizedField(
                name="supplier_name",
                rawLabel="Proveedor",
                rawValue=supplier_name,
                normalizedValue=supplier_name,
                confidence=92.0,
            )
        )

    if tax_identifier:
        normalized_fields.append(
            NormalizedField(
                name="tax_identifier",
                rawLabel="Identificación tributaria",
                rawValue=tax_identifier,
                normalizedValue=tax_identifier,
                confidence=91.0,
            )
        )

    if document_number:
        normalized_fields.append(
            NormalizedField(
                name="document_number",
                rawLabel="Número de documento",
                rawValue=document_number,
                normalizedValue=document_number,
                confidence=89.0,
            )
        )

    if document_date:
        normalized_fields.append(
            NormalizedField(
                name="document_date",
                rawLabel="Fecha",
                rawValue=document_date,
                normalizedValue=document_date,
                confidence=88.0,
            )
        )

    if subtotal is not None:
        normalized_fields.append(
            NormalizedField(
                name="subtotal",
                rawLabel="Subtotal",
                rawValue=str(subtotal),
                normalizedValue=str(subtotal),
                confidence=93.0,
            )
        )

    if tax is not None:
        normalized_fields.append(
            NormalizedField(
                name="tax",
                rawLabel="IVA",
                rawValue=str(tax),
                normalizedValue=str(tax),
                confidence=92.0,
            )
        )

    if total is not None:
        normalized_fields.append(
            NormalizedField(
                name="total",
                rawLabel="Total",
                rawValue=str(total),
                normalizedValue=str(total),
                confidence=94.0,
            )
        )

    return OCRProcessResponse(
        success=success,
        processStatus=process_status,
        rawText=raw_text,
        confidenceAvg=91.5 if success else 0.0,
        documentContext=DocumentContext(
            countryDetected=country,
            languageDetected="es",
            documentType=document_type,
            currency=CurrencyContext(**currency),
        ),
        normalizedFields=normalized_fields,
        extraFields=[
            ExtraField(
                rawLabel="Fuente",
                rawValue="PaddleOCR real",
                confidence=95.0,
            )
        ],
        items=[],
        totals=Totals(
            subtotal=subtotal,
            tax=tax,
            total=total,
            taxIncludedInPrices=False,
        ),
        errorMessage=error_message,
    )