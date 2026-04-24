import re
from typing import Optional


def detect_currency(text: str):
    upper_text = text.upper()

    if "GTQ" in upper_text or "QUETZAL" in upper_text or " Q" in text:
        return {
            "code": "GTQ",
            "symbol": "Q",
            "decimalSeparator": ".",
            "thousandsSeparator": ",",
        }

    if "USD" in upper_text or "$" in text:
        return {
            "code": "USD",
            "symbol": "$",
            "decimalSeparator": ".",
            "thousandsSeparator": ",",
        }

    if "CRC" in upper_text or "₡" in text:
        return {
            "code": "CRC",
            "symbol": "₡",
            "decimalSeparator": ".",
            "thousandsSeparator": ",",
        }

    return {
        "code": None,
        "symbol": None,
        "decimalSeparator": ".",
        "thousandsSeparator": ",",
    }


def detect_country(text: str) -> Optional[str]:
    upper_text = text.upper()

    if "NIT" in upper_text or "GUATEMALA" in upper_text:
        return "GT"

    if "COSTA RICA" in upper_text or "CÉDULA JURÍDICA" in upper_text:
        return "CR"

    if "HONDURAS" in upper_text or "RTN" in upper_text:
        return "HN"

    if "EL SALVADOR" in upper_text or "NRC" in upper_text:
        return "SV"

    return None


def detect_document_type(text: str) -> Optional[str]:
    upper_text = text.upper()

    if "FACTURA" in upper_text:
        return "FACTURA"
    if "RECIBO" in upper_text:
        return "RECIBO"
    if "CREDITO FISCAL" in upper_text:
        return "CREDITO_FISCAL"

    return "DOCUMENTO"


def extract_simple_field(text: str, labels: list[str]) -> Optional[str]:
    lines = text.splitlines()

    for line in lines:
        line_clean = line.strip()
        upper_line = line_clean.upper()

        for label in labels:
            if label.upper() in upper_line:
                parts = re.split(rf"{label}\s*[:\-]?\s*", line_clean, flags=re.IGNORECASE)
                if len(parts) > 1:
                    value = parts[-1].strip()
                    if value:
                        return value

    return None


def extract_amount(text: str, labels: list[str]) -> Optional[float]:
    lines = text.splitlines()

    for line in lines:
        upper_line = line.upper()
        for label in labels:
            if label.upper() in upper_line:
                match = re.search(r"(-?\d[\d,]*\.?\d{0,2})", line.replace("Q", "").replace("$", "").replace("₡", ""))
                if match:
                    raw = match.group(1).replace(",", "")
                    try:
                        return float(raw)
                    except ValueError:
                        return None
    return None