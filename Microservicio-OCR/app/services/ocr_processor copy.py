import io
import logging
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageOps

from app.schemas import (
    OCRProcessResponse,
    DocumentContext,
    CurrencyContext,
    NormalizedField,
    ExtraField,
    Totals,
)
from app.utils.parsers import (
    detect_country,
    detect_currency,
    detect_document_type,
    extract_amount,
    extract_simple_field,
)

from paddleocr import PaddleOCR

logger = logging.getLogger(__name__)

# Inicializar una sola vez
from paddleocr import PaddleOCR

ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = PaddleOCR(lang="es")
    return ocr_engine


MAX_IMAGE_SIDE = 2500
JPEG_QUALITY = 85


def image_bytes_to_pil(file_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(file_bytes))
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


def resize_if_needed(image: Image.Image, max_side: int = MAX_IMAGE_SIDE) -> Image.Image:
    width, height = image.size
    largest_side = max(width, height)

    if largest_side <= max_side:
        return image

    scale = max_side / largest_side
    new_width = int(width * scale)
    new_height = int(height * scale)

    logger.info(
        "Redimensionando imagen OCR de %sx%s a %sx%s",
        width,
        height,
        new_width,
        new_height,
    )

    return image.resize((new_width, new_height), Image.LANCZOS)


def image_to_numpy(image: Image.Image) -> np.ndarray:
    return np.array(image)


def extract_text_from_paddle_result(result) -> str:
    """
    Compatible con distintos formatos devueltos por PaddleOCR.
    """
    lines: List[str] = []

    if not result:
        return ""

    # Caso 1: formato antiguo ocr(...)
    try:
        for block in result:
            if not block:
                continue

            for item in block:
                try:
                    text = item[1][0]
                    if text:
                        lines.append(str(text))
                except Exception:
                    continue

        if lines:
            return "\n".join(lines)
    except Exception:
        pass

    # Caso 2: formato nuevo predict(...)
    try:
        for page in result:
            rec_texts = None

            if isinstance(page, dict):
                rec_texts = page.get("rec_texts")
            else:
                rec_texts = getattr(page, "rec_texts", None)

            if rec_texts:
                for text in rec_texts:
                    if text:
                        lines.append(str(text))

        if lines:
            return "\n".join(lines)
    except Exception:
        pass

    return ""


def run_ocr_on_image(image_np):
    try:
        ocr = get_ocr_engine()

        if ocr is None:
            raise RuntimeError("No se pudo inicializar el motor OCR")

        result = ocr.ocr(image_np)
        return result

    except Exception as e:
        print("Error ejecutando OCR")
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Error OCR: {str(e)}")


def build_success_response(raw_text: str) -> OCRProcessResponse:
    country = detect_country(raw_text)
    currency = detect_currency(raw_text)
    document_type = detect_document_type(raw_text)

    supplier_name = extract_simple_field(raw_text, ["Proveedor", "Emisor", "Razón Social", "Nombre"])
    tax_identifier = extract_simple_field(raw_text, ["NIT", "RTN", "RUC", "NRC", "Cédula Jurídica"])
    document_number = extract_simple_field(raw_text, ["Factura No", "Número", "No. Documento", "Serie", "No."])
    document_date = extract_simple_field(raw_text, ["Fecha", "Fecha Emisión", "Fecha de Emisión"])

    subtotal = extract_amount(raw_text, ["Subtotal", "Sub-Total"])
    tax = extract_amount(raw_text, ["IVA", "Impuesto", "Tax"])
    total = extract_amount(raw_text, ["Total", "TOTAL A PAGAR"])

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
        success=True,
        processStatus="OK",
        rawText=raw_text,
        confidenceAvg=91.5,
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
        errorMessage=None,
    )


def build_error_response(filename: str, content_type: str, error_message: str) -> OCRProcessResponse:
    return OCRProcessResponse(
        success=False,
        processStatus="ERROR_OCR",
        rawText=f"Documento recibido: {filename}\nTipo MIME: {content_type}",
        confidenceAvg=0.0,
        documentContext=DocumentContext(
            countryDetected=None,
            languageDetected="es",
            documentType=None,
            currency=CurrencyContext(
                code=None,
                symbol=None,
                decimalSeparator=".",
                thousandsSeparator=",",
            ),
        ),
        normalizedFields=[],
        extraFields=[
            ExtraField(
                rawLabel="Fuente",
                rawValue="PaddleOCR real",
                confidence=95.0,
            )
        ],
        items=[],
        totals=Totals(
            subtotal=None,
            tax=None,
            total=None,
            taxIncludedInPrices=False,
        ),
        errorMessage=error_message,
    )


def process_document_bytes(file_bytes: bytes, filename: str, content_type: str) -> OCRProcessResponse:
    try:
        is_image = content_type.startswith("image/") or filename.lower().endswith(
            (".png", ".jpg", ".jpeg", ".webp", ".bmp")
        )

        if is_image:
            image = image_bytes_to_pil(file_bytes)
            raw_text, error_message = run_ocr_on_image(image)

            if error_message:
                return build_error_response(filename, content_type, error_message)

            return build_success_response(raw_text)

        # Fallback para no-imagen
        try:
            raw_text = file_bytes.decode("utf-8")
        except Exception:
            raw_text = ""

        if not raw_text.strip():
            return build_error_response(
                filename,
                content_type,
                "Tipo de archivo no soportado para OCR en esta versión",
            )

        return build_success_response(raw_text)

    except Exception as e:
        logger.exception("Error general procesando documento")
        return build_error_response(filename, content_type, f"Error general OCR: {str(e)}")