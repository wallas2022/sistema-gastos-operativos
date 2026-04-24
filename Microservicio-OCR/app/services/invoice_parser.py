from email.mime import text
import re
from typing import Any, Dict, List, Optional


def clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def normalize_amount(value: Optional[str]) -> Optional[float]:

    
    if not value:
        return None

    value = value.strip()
    value = value.replace("Q", "")
    value = value.replace(",", "")
    value = value.replace("O", "0")
    value = value.replace("o", "0")

    try:
        return float(value)
    except ValueError:
        return None


def first_match(pattern: str, text: str, flags=re.IGNORECASE) -> Optional[str]:
    match = re.search(pattern, text, flags)
    if not match:
        return None
    return match.group(1).strip()

def add_field(
    fields: List[Dict[str, Any]],
    name: str,
    label: str,
    raw_value: Any,
    normalized_value: Any = None,
    confidence: float = 90.0,
):
    if raw_value is not None and raw_value != "":
        if normalized_value is None:
            normalized_value = raw_value

        fields.append({
            "name": name,
            "rawLabel": label,
            "rawValue": str(raw_value),
            "normalizedValue": str(normalized_value),
            "confidence": confidence,
        })
def normalize_authorization(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    value = value.strip().upper()
    value = value.replace("×", "X")
    value = value.replace("O", "0")

    return value 

       

def extract_invoice_fields(raw_text: str) -> Dict[str, Any]:
    text = clean_text(raw_text)

    normalized_fields: List[Dict[str, Any]] = []
    items: List[Dict[str, Any]] = []

    # -------------------------
    # Tipo de documento
    # -------------------------
    document_type = "FACTURA" if re.search(r"FACTURA", text, re.IGNORECASE) else None

    # -------------------------
    # Emisor
    # -------------------------
    issuer_nit = first_match(r"NIT:\s*([0-9\-]+)", text)

    issuer_name = None
    issuer_block = re.search(
        r"Datos del Emisor[\s\S]{0,120}?NIT:\s*[0-9\-]+\s*\n?(.+?)\n",
        text,
        re.IGNORECASE
    )
    if issuer_block:
        issuer_name = issuer_block.group(1).strip()

    # Fallback para tu factura específica
    if not issuer_name:
        issuer_name = first_match(r"\n([A-ZÁÉÍÓÚÑ0-9 ,\.]+SOCIEDAD ANONIMA)", text)

    # -------------------------
    # Documento tributario
    # -------------------------
    serie = first_match(r"Serie:\s*([A-Z0-9\-]+)", text)
    dte_number = first_match(r"No\.?\s*de\s*DTE:\s*([0-9]+)", text)

    # -------------------------
    # Comprador
    # -------------------------
    buyer_date = first_match(r"Fecha:\s*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})", text)
    buyer_nit = first_match(r"DATOS DEL COMPRADOR[\s\S]{0,100}?NIT:\s*([A-Z0-9\-]+)", text)
    buyer_name = first_match(r"Nombre:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 ,\.]+)", text)

    # -------------------------
    # Totales
    # -------------------------
    total_value = None

    # Busca líneas tipo: TOTAL 029.95
    total_match = re.search(r"\bTOTAL\s+([0-9O]{1,6}[.,][0-9O]{2})", text, re.IGNORECASE)
    if total_match:
        total_value = normalize_amount(total_match.group(1))

    # Si encuentra varios montos y no encontró total, toma el último monto razonable
    if total_value is None:
        amounts = re.findall(r"([0-9O]{1,6}[.,][0-9O]{2})", text)
        if amounts:
            total_value = normalize_amount(amounts[-1])

    tax_value = None
    tax_match = re.search(r"IMPUESTO\s+IVA[:\s\n]*Q?\s*([0-9O]{1,8}[.,][0-9O]{2})",
    text,
    re.IGNORECASE
    )

    if tax_match:
         tax_value = normalize_amount(tax_match.group(1))

    subtotal_value = None
    if total_value is not None and tax_value is not None:
        subtotal_value = round(total_value - tax_value, 2)

    # -------------------------
    # Moneda
    # -------------------------
    currency_text = first_match(r"Moneda utilizada:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ]+)", text)
    currency_code = None
    currency_symbol = None

    if currency_text:
        if "quetzal" in currency_text.lower():
            currency_code = "GTQ"
            currency_symbol = "Q"
        else:
            currency_code = currency_text.upper()

    # -------------------------
    # Número de autorización
    # -------------------------
    authorization_number_raw = first_match( r"([A-Z0-9O]{8}-[A-Z0-9O]{4}-[A-Z0-9O]{4}-[A-Z0-9O]{4}-[A-Z0-9O]{12})",text)
    authorization_number = normalize_authorization(authorization_number_raw)

    certification_date = first_match(
        r"Fecha Certificaci[oó]n:\s*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})",
        text
    )

    certifier_nit = first_match(r"Datos del Certificador[\s\S]{0,80}?NIT:\s*([0-9\-]+)", text)
    certifier_name = first_match(r"NIT:\s*[0-9\-]+\s*\n?([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 \.,]+S\.A\.)", text)

    # -------------------------
    # Productos / detalle
    # -------------------------
    item_match = re.search(
        r"\n\s*([0-9]+)\s+(.+?)\s+([0-9O]{1,6}[.,][0-9O]{2})\s+([0-9O]{1,6}[.,][0-9O]{2})",
        text,
        re.IGNORECASE
    )

    if item_match:
        quantity = int(item_match.group(1))
        description = item_match.group(2).strip()
        unit_price = normalize_amount(item_match.group(3))
        line_total = normalize_amount(item_match.group(4))

        items.append({
            "lineNumber": 1,
            "article": None,
            "description": description,
            "quantity": quantity,
            "unitPrice": unit_price,
            "lineSubtotal": None,
            "lineTax": None,
            "lineTotal": line_total,
            "taxIncluded": False,
            "confidence": 85.0,
        })

    # -------------------------
    # Campos normalizados
    # -------------------------
    add_field(normalized_fields, "issuer_name", "Nombre del emisor", issuer_name)
    add_field(normalized_fields, "issuer_nit", "NIT del emisor", issuer_nit)
    add_field(normalized_fields, "serie", "Serie", serie)
    add_field(normalized_fields, "dte_number", "Número DTE", dte_number)
    add_field(normalized_fields, "invoice_date", "Fecha de factura", buyer_date)
    add_field(normalized_fields, "buyer_nit", "NIT del comprador", buyer_nit)
    add_field(normalized_fields, "buyer_name", "Nombre del comprador", buyer_name)
    add_field(normalized_fields, "authorization_number", "Número de autorización", authorization_number)
    add_field(normalized_fields, "certification_date", "Fecha de certificación", certification_date)
    add_field(normalized_fields, "certifier_nit", "NIT certificador", certifier_nit)
    add_field(normalized_fields, "certifier_name", "Certificador", certifier_name)
    add_field(normalized_fields, "currency", "Moneda", currency_code)
    add_field(normalized_fields, "subtotal", "Subtotal", subtotal_value)
    add_field(normalized_fields, "tax", "IVA", tax_value)
    add_field(normalized_fields, "total", "Total", total_value) 

    # -------------------------
    # Confianza
    # -------------------------
    if len(normalized_fields) >= 8:
        process_status = "PROCESADO"
        success = True
    elif len(normalized_fields) >= 3:
        process_status = "PENDIENTE_REVISION"
        success = True
    else:
        process_status = "ERROR_OCR"
        success = False

    confidence_avg = 0.0
    if normalized_fields:
        confidence_avg = round(
            sum(field["confidence"] for field in normalized_fields) / len(normalized_fields),
            2
        )

    return {
        "success": success,
        "processStatus": process_status,
        "confidenceAvg": confidence_avg,
        "documentContext": {
            "countryDetected": "GT",
            "languageDetected": "es",
            "documentType": document_type or "FACTURA",
            "currency": {
                "code": currency_code,
                "symbol": currency_symbol,
                "decimalSeparator": ".",
                "thousandSeparator": ","
            }
        },
        "normalizedFields": normalized_fields,
        "extraFields": [],
        "items": items,
       "totals": {
            "subtotal": subtotal_value,
            "tax": tax_value,
            "total": total_value,
            "taxIncludedInPrices": False,
        }
    }