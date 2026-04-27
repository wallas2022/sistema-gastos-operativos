import re
from typing import Any, Dict, List, Optional


# ============================================================
# Limpieza general
# ============================================================

def clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()

def normalize_amount(value: Optional[str]) -> Optional[float]:
    if not value:
        return None

    text = str(value).upper().strip()

    # Si no tiene decimal y no tiene Q, no lo tratamos como monto.
    # Esto evita que CTA #: 51744600 se convierta en total.
    if "." not in text and "," not in text and "Q" not in text:
        return None

    # Quitar símbolos y letras comunes de ticket
    text = text.replace("Q", "")
    text = text.replace("G", "")
    text = text.replace("=", " ")
    text = text.replace(",", "")
    text = text.strip()

    match = re.search(r"0*\d{1,6}\.\d{1,2}", text)

    if not match:
        return None

    try:
        return float(match.group(0))
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


# ============================================================
# Moneda
# ============================================================
def detect_currency(raw_text: str) -> Dict[str, Optional[str]]:
    text = raw_text.upper()

    if (
        "Q" in text
        or "QUETZAL" in text
        or "QUETZALES" in text
        or "GUATEMALA" in text
        or re.search(r"\d+\.\d{2}\s*G\b", text)
    ):
        return {
            "code": "GTQ",
            "symbol": "Q",
            "decimalSeparator": ".",
            "thousandSeparator": ",",
        }

    return {
        "code": None,
        "symbol": None,
        "decimalSeparator": ".",
        "thousandSeparator": ",",
    }
# ============================================================
# Totales
# ============================================================
def extract_total(text: str) -> Optional[float]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidates: List[float] = []

    forbidden_words = [
        "CTA",
        "CUENTA",
        "REFERENCIA",
        "AUTORIZA",
        "AUTORIZACION",
        "TC#",
        "TARJETA",
        "TARJETAS",
        "CAMBIO",
        "IMPUESTO",
        "IVA",
        "NIT",
        "DTE",
        "SERIE",
    ]

    for i, line in enumerate(lines):
        upper = line.upper()

        # Solo aceptar bloques explícitos de total
        if upper in ["TOTAL", "TOTAL:", "TOTA", "TOTA:"]:
            for next_line in lines[i + 1:i + 4]:
                next_upper = next_line.upper()

                if any(word in next_upper for word in forbidden_words):
                    continue

                amount = normalize_amount(next_line)

                if amount is not None and 0 < amount < 100000:
                    candidates.append(amount)

    if candidates:
        return max(candidates)

    return None

def extract_tax(text: str) -> Optional[float]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidates: List[float] = []

    for i, line in enumerate(lines):
        upper = line.upper()

        if any(word in upper for word in ["IMPUESTO", "IVA", "I.V.A"]):
            amount = normalize_amount(line)

            if amount is not None and amount > 0:
                candidates.append(amount)

            # En tu factura viene:
            # Impuesto
            # Q33.57
            for next_line in lines[i + 1:i + 4]:
                amount = normalize_amount(next_line)
                if amount is not None and amount > 0:
                    candidates.append(amount)

    if candidates:
        return max(candidates)

    return None

# ============================================================
# Items / detalle de factura
# ============================================================

def extract_items(text: str) -> List[Dict[str, Any]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    items: List[Dict[str, Any]] = []

    stop_words = [
        "TOTAL", "SUBTOTAL", "TARJETA", "TARJETAS", "EFECTIVO", "CAMBIO",
        "AUTORIZA", "AUTORIZACION", "AUTORIZACIÓN", "REFERENCIA",
        "NUMERO", "NÚMERO", "NIT", "FECHA", "SERIE", "CERTIFICADOR",
        "DOCUMENTO", "FACTURA", "CONSUMIDOR", "CLIENTE", "IMPUESTO",
        "IVA", "ARTS", "VENDIDOS", "SERVICIO A DOMICILIO",
        "PRODUCTO GRAVADO", "PRODUCTO EXENTO", "S.A.C", "LLAMA GRATIS",
        "COBRA AQUI", "REMESA", "CUENTANOS", "EXPERIENCIA", "ID RECEPTOR",
        "NOMBRE", "TDA#", "OP#", "TE#", "TR#", "CTA", "TC#", "REF:",
        "GUATEMALA", "DOCUMENTO TRIBUTARIO", "AGENTE DE RETENCION",
        "LE ATENDIO", "LE ATENDIÓ", "TEL", "TELEFONO", "TELÉFONO",
        "DATOS DEL", "SUJETOS", "TRIMESTRALES", "PAGOS", "RETENCION",
        "RETENCIÓN",
    ]

    header_words = [
        "CANT", "DESCRIPCION", "DESCRIPCIÓN", "PRECIO", "TOTAL LÍNEA",
        "TOTAL LINEA"
    ]

    def normalize_line(value: str) -> str:
        return value.upper().replace("×", "X").strip()

    def is_stop_line(value: str) -> bool:
        upper = normalize_line(value)
        return any(word in upper for word in stop_words)

    def is_header_line(value: str) -> bool:
        upper = normalize_line(value)
        return any(word in upper for word in header_words)

    def is_money_line(value: str) -> bool:
        upper = normalize_line(value).replace(",", "")
        return bool(re.search(r"(Q\s*)?0*\d{1,6}\.\d{1,2}\s*(G|Q)?", upper))

    def extract_money_values(value: str) -> List[float]:
        upper = normalize_line(value).replace(",", "")

        matches = re.findall(
            r"(?:Q\s*)?0*\d{1,6}\.\d{1,2}\s*(?:G|Q)?",
            upper,
        )

        values = []

        for match in matches:
            amount = normalize_amount(match)
            if amount is not None and amount > 0:
                values.append(amount)

        return values

    def is_code_line(value: str) -> bool:
        upper = normalize_line(value)

        if re.fullmatch(r"[0-9]{4,}L?", upper):
            return True

        if re.fullmatch(r"[0-9]{3,}", upper):
            return True

        return False

    def clean_description(value: str) -> str:
        desc = value.strip()

        # Quitar encabezados
        desc = re.sub(r"(?i)^cant\.?\s*descripcion$", "", desc)
        desc = re.sub(r"(?i)^cant\.?\s*descripción$", "", desc)
        desc = re.sub(r"(?i)^descripcion$", "", desc)
        desc = re.sub(r"(?i)^descripción$", "", desc)

        # Quitar flechas tipo -> NORMAL, -> VASO
        desc = re.sub(r"^[-=]*>\s*", "", desc)

        # Quitar cantidad inicial: 1 DONAS MANIA -> DONAS MANIA
        desc = re.sub(r"^\d+\s+", "", desc)

        # Quitar códigos largos al final
        desc = re.sub(r"\s+[0-9]{5,}L?$", "", desc, flags=re.IGNORECASE)

        # Quitar precios pegados
        desc = re.sub(
            r"(Q\s*)?0*\d{1,6}\.\d{1,2}\s*(G|Q)?",
            "",
            desc,
            flags=re.IGNORECASE,
        )

        desc = re.sub(r"\s{2,}", " ", desc).strip()
        return desc

    def is_product_line(value: str) -> bool:
        upper = normalize_line(value)

        if not upper:
            return False

        if is_header_line(value):
            return False

        if is_stop_line(value):
            return False

        if is_money_line(value):
            return False

        if is_code_line(value):
            return False

        if upper.startswith("->") or upper.startswith("- >") or upper.startswith(">"):
            return False

        # Debe tener letras
        if not re.search(r"[A-ZÁÉÍÓÚÑ]", upper):
            return False

        return True

    def get_quantity_and_description(line: str):
        """
        Detecta:
        1 DONAS MANIA
        1 Pastel De Frutas
        PAN CHAP 10U
        """
        match = re.match(r"^(\d+)\s+(.+)$", line.strip())

        if match:
            quantity = int(match.group(1))
            description = clean_description(match.group(2))
            return quantity, description

        return 1, clean_description(line)

    i = 0

    while i < len(lines):
        current_line = lines[i]

        if not is_product_line(current_line):
            i += 1
            continue

        quantity, description = get_quantity_and_description(current_line)

        if not description:
            i += 1
            continue

        price_candidates = []
        modifiers = []

        for j in range(i + 1, min(i + 8, len(lines))):
            next_line = lines[j]
            next_upper = normalize_line(next_line)

            if is_stop_line(next_line):
                break

            # Si viene otro producto antes de encontrar monto, parar
            if j > i + 1 and is_product_line(next_line):
                break

            # Modificadores tipo -> NORMAL o -> VASO
            if next_upper.startswith("->") or next_upper.startswith("- >") or next_upper.startswith(">"):
                modifier = clean_description(next_line)
                if modifier:
                    modifiers.append(modifier)
                continue

            amounts = extract_money_values(next_line)

            for amount in amounts:
                price_candidates.append({
                    "amount": amount,
                    "line": next_line,
                    "index": j,
                })

        if not price_candidates:
            i += 1
            continue

        # Seleccionar el último monto cercano como total de línea
        selected = price_candidates[-1]
        line_total = selected["amount"]

        unit_price = line_total

        if quantity and quantity > 0:
            unit_price = round(line_total / quantity, 2)

        # Si hay modificadores, se agregan en la descripción, no como líneas separadas
        if modifiers:
            description = f"{description} ({', '.join(modifiers)})"

        items.append({
            "lineNumber": len(items) + 1,
            "article": None,
            "description": description,
            "quantity": quantity,
            "unitPrice": round(unit_price, 2),
            "lineSubtotal": None,
            "lineTax": None,
            "lineTotal": round(line_total, 2),
            "taxIncluded": False,
            "confidence": 75.0,
        })

        i = selected["index"] + 1

    return items
# ============================================================
# Función principal
# ============================================================

def extract_invoice_fields(raw_text: str) -> Dict[str, Any]:
    text = clean_text(raw_text)

    normalized_fields: List[Dict[str, Any]] = []

    # -------------------------
    # Tipo de documento
    # -------------------------
    document_type = "FACTURA" if re.search(r"FACTURA|FEL|DTE", text, re.IGNORECASE) else "FACTURA"

    # -------------------------
    # Emisor
    # -------------------------
    issuer_nit = first_match(r"NIT:\s*([0-9\-]+)", text)

    issuer_name = None
    issuer_block = re.search(
        r"Datos del Emisor[\s\S]{0,160}?NIT:\s*[0-9\-]+\s*\n?(.+?)\n",
        text,
        re.IGNORECASE,
    )

    if issuer_block:
        issuer_name = issuer_block.group(1).strip()

    if not issuer_name:
        issuer_name = first_match(r"\n([A-ZÁÉÍÓÚÑ0-9 ,\.]+SOCIEDAD ANONIMA)", text)

    if not issuer_name:
        issuer_name = first_match(r"\n([A-ZÁÉÍÓÚÑ0-9 ,\.]+S\.A\.?)", text)

    # -------------------------
    # Documento tributario
    # -------------------------
    serie = first_match(r"Serie:\s*([A-Z0-9\-]+)", text)
    dte_number = first_match(r"No\.?\s*de\s*DTE:\s*([0-9]+)", text)

    if not dte_number:
        dte_number = first_match(r"N[uú]mero\s+de\s+DTE[:\s]*([0-9]+)", text)

    # -------------------------
    # Comprador
    # -------------------------
    buyer_date = first_match(r"Fecha:\s*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})", text)

    if not buyer_date:
        buyer_date = first_match(r"Fecha\s+de\s+emisi[oó]n[:\s]*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})", text)

    buyer_nit = first_match(r"DATOS DEL COMPRADOR[\s\S]{0,120}?NIT:\s*([A-Z0-9\-]+)", text)

    if not buyer_nit:
        buyer_nit = first_match(r"NIT:\s*(CF|C\/F|[A-Z0-9\-]+)", text)

    buyer_name = first_match(r"Nombre:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 ,\.]+)", text)

    if buyer_name:
        buyer_name = buyer_name.strip()
        buyer_name = re.sub(r"\s{2,}", " ", buyer_name)

    # -------------------------
    # Moneda
    # -------------------------
    currency = detect_currency(text)
    currency_code = currency["code"]
    currency_symbol = currency["symbol"]

    # -------------------------
    # Totales
    # -------------------------
    total_value = extract_total(text)
    tax_value = extract_tax(text)

    subtotal_value = None
    if total_value is not None and tax_value is not None:
        subtotal_value = round(total_value - tax_value, 2)

    # -------------------------
    # Número de autorización
    # -------------------------
    authorization_number_raw = first_match(
        r"([A-Z0-9O]{8}-[A-Z0-9O]{4}-[A-Z0-9O]{4}-[A-Z0-9O]{4}-[A-Z0-9O]{12})",
        text,
    )
    authorization_number = normalize_authorization(authorization_number_raw)

    certification_date = first_match(
        r"Fecha Certificaci[oó]n:\s*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})",
        text,
    )

    if not certification_date:
        certification_date = first_match(
            r"Fecha\s+de\s+certificaci[oó]n[:\s]*([0-9]{2}[-/][0-9]{2}[-/][0-9]{4})",
            text,
        )

    certifier_nit = first_match(r"Datos del Certificador[\s\S]{0,100}?NIT:\s*([0-9\-]+)", text)

    if not certifier_nit:
        certifier_nit = first_match(r"NIT:\s*([0-9]{5,}-?[0-9]?)\s*\n?InFile", text)

    certifier_name = first_match(r"NIT:\s*[0-9\-]+\s*\n?([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 \.,]+S\.A\.)", text)

    if not certifier_name:
        certifier_name = first_match(r"(InFile\s*S\.A\.?)", text)

    # -------------------------
    # Productos / detalle
    # -------------------------
    items = extract_items(text)

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
    # Estado y confianza
    # -------------------------
    has_fields = len(normalized_fields) > 0
    has_items = len(items) > 0
    has_total = total_value is not None

    success = has_fields or has_items or has_total

    if len(normalized_fields) >= 8 or has_items:
        process_status = "PROCESADO"
    elif len(normalized_fields) >= 3 or has_total:
        process_status = "PENDIENTE_REVISION"
    else:
        process_status = "ERROR_OCR"

    confidence_avg = 0.0
    if normalized_fields:
        confidence_avg = round(
            sum(field["confidence"] for field in normalized_fields) / len(normalized_fields),
            2,
        )
    elif success:
        confidence_avg = 75.0

    return {
        "success": success,
        "processStatus": process_status,
        "confidenceAvg": confidence_avg,
        "documentContext": {
            "countryDetected": "GT",
            "languageDetected": "es",
            "documentType": document_type,
            "currency": {
                "code": currency_code,
                "symbol": currency_symbol,
                "decimalSeparator": ".",
                "thousandSeparator": ",",
            },
        },
        "normalizedFields": normalized_fields,
        "extraFields": [],
        "items": items,
        "totals": {
            "subtotal": subtotal_value,
            "tax": tax_value,
            "total": total_value,
            "taxIncludedInPrices": False,
        },
        "errorMessage": None if success else "No se pudieron extraer campos del documento",
    }