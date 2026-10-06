import re

from .models import BlockType, ExtractedValue
from .text import normalized, parse_amount


class FieldExtractor:
    SKIP_ITEM = ("DESCRIPCION", "CANTIDAD", "PRECIO", "HISTORIAL", "AUTORIZACION", "FECHA", "DOCUMENTO", "SUBTOTAL", "IMPUESTO", "IVA", "TOTAL")

    def extract(self, blocks, template, optical_confidence):
        fields = []
        for definition in template.fields:
            value = self._from_block(blocks[definition.block].lines, definition)
            if value is not None:
                raw, alias, rule = value
                normalized_value = self._normalize_value(raw, definition.value_type)
                if normalized_value is not None:
                    fields.append(ExtractedValue(definition.name, alias, raw, str(normalized_value), definition.block, rule, optical_confidence))
        items = self._extract_items(blocks[BlockType.DETAIL].lines, optical_confidence)
        totals = {"subtotal": None, "tax": None, "total": None, "taxIncludedInPrices": None}
        for field in fields:
            if field.name in totals:
                totals[field.name] = float(field.normalized_value)
        return fields, items, totals

    def _from_block(self, lines, definition):
        aliases = tuple(sorted((normalized(alias) for alias in definition.aliases), key=len, reverse=True))
        for index, line in enumerate(lines):
            canonical = normalized(line)
            if definition.name == "total" and canonical.startswith(("SUBTOTAL", "SUB-TOTAL")):
                continue
            alias = next((a for a in aliases if re.search(r"(?:^|\s)" + re.escape(a) + r"(?:\s|:|#|-|$)", canonical)), None)
            if not alias:
                continue
            value = line.split(":", 1)[1].strip() if ":" in line else re.sub(r"^.*?" + re.escape(alias) + r"\s*[#-]?\s*", "", canonical, count=1)
            if not value and canonical == alias and index + 1 < len(lines) and ":" not in lines[index + 1]:
                value = lines[index + 1].strip()
            if value and normalized(value) not in aliases:
                return value.strip(), alias, f"CONTEXT_ALIAS_IN_{definition.block.value}"
        return None

    @staticmethod
    def _normalize_value(value, value_type):
        if value_type == "amount":
            return parse_amount(value)
        if value_type == "identifier":
            match = re.search(r"[A-Z0-9][A-Z0-9-]{3,24}", normalized(value))
            return match.group(0) if match else None
        if value_type == "date":
            match = re.search(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", value)
            return match.group(0) if match else value.strip()
        return value.strip()

    def _extract_items(self, lines, confidence):
        items = []
        for line in lines:
            canonical = normalized(line)
            if not canonical or any(word in canonical for word in self.SKIP_ITEM):
                continue
            numbers = re.findall(r"-?\d[\d.,]*", line)
            if len(numbers) < 2:
                continue
            quantity = parse_amount(numbers[0])
            total = parse_amount(numbers[-1])
            if quantity is None or total is None:
                continue
            description = re.sub(r"-?\d[\d.,]*", " ", line)
            description = re.sub(r"\s+", " ", description).strip(" -|:")
            if len(description) < 2:
                continue
            unit_price = parse_amount(numbers[-2]) if len(numbers) >= 3 else (total / quantity if quantity else None)
            items.append({"lineNumber": len(items) + 1, "article": None, "description": description, "quantity": quantity, "unitPrice": unit_price, "lineSubtotal": total, "lineTax": None, "lineTotal": total, "taxIncluded": None, "confidence": round(confidence, 2)})
        return items
