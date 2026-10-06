import re
import unicodedata
from typing import Optional


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", value.upper()).strip()


def parse_amount(value: str) -> Optional[float]:
    match = re.search(r"-?\d[\d.,]*", value.replace("Q", " ").replace("$", " "))
    if not match:
        return None
    raw = match.group(0)
    if "," in raw and "." in raw:
        raw = raw.replace(",", "") if raw.rfind(".") > raw.rfind(",") else raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        tail = raw.rsplit(",", 1)[1]
        raw = raw.replace(",", ".") if len(tail) <= 2 else raw.replace(",", "")
    try:
        return round(float(raw), 2)
    except ValueError:
        return None
