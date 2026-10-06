from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class BlockType(str, Enum):
    HEADER = "HEADER"
    ISSUER = "ISSUER"
    BUYER = "BUYER"
    DETAIL = "DETAIL"
    TAXES = "TAXES"
    FOOTER = "FOOTER"
    GENERAL = "GENERAL"


@dataclass(frozen=True)
class DocumentClassification:
    document_type: str
    country: Optional[str]
    currency_code: Optional[str]
    currency_symbol: Optional[str]
    rule: str
    confidence: float


@dataclass
class DocumentBlock:
    type: BlockType
    lines: list[str] = field(default_factory=list)
    start_line: int = 0
    end_line: int = 0

    @property
    def text(self) -> str:
        return "\n".join(self.lines).strip()


@dataclass(frozen=True)
class FieldDefinition:
    name: str
    label: str
    block: BlockType
    aliases: tuple[str, ...]
    value_type: str = "text"
    pattern: Optional[str] = None
    required: bool = False


@dataclass(frozen=True)
class TemplateDefinition:
    id: str
    country: Optional[str]
    document_type: str
    aliases: tuple[str, ...]
    fields: tuple[FieldDefinition, ...]
    version: int = 1


@dataclass
class ExtractedValue:
    name: str
    label: str
    raw_value: str
    normalized_value: str
    block: BlockType
    rule: str
    confidence: float

    def as_api_field(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "rawLabel": self.label,
            "rawValue": self.raw_value,
            "normalizedValue": self.normalized_value,
            "confidence": round(self.confidence, 2),
            "sourceBlock": self.block.value,
            "extractionRule": self.rule,
        }


@dataclass
class IntelligenceResult:
    success: bool
    process_status: str
    confidence_avg: float
    classification: DocumentClassification
    template_id: str
    fields: list[ExtractedValue]
    items: list[dict[str, Any]]
    totals: dict[str, Any]
    validation_messages: list[str]

    def as_api_response(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "processStatus": self.process_status,
            "confidenceAvg": round(self.confidence_avg, 2),
            "documentContext": {
                "countryDetected": self.classification.country,
                "languageDetected": "es",
                "documentType": self.classification.document_type,
                "currency": {
                    "code": self.classification.currency_code,
                    "symbol": self.classification.currency_symbol,
                    "decimalSeparator": ".",
                    "thousandsSeparator": ",",
                },
            },
            "normalizedFields": [field.as_api_field() for field in self.fields],
            "extraFields": [
                {
                    "rawLabel": "Plantilla resuelta",
                    "rawValue": self.template_id,
                    "confidence": self.classification.confidence,
                },
                *[
                    {"rawLabel": "Validación", "rawValue": message, "confidence": 100.0}
                    for message in self.validation_messages
                ],
            ],
            "items": self.items,
            "totals": self.totals,
            "errorMessage": None if self.success else "No se pudieron interpretar campos del documento.",
        }
