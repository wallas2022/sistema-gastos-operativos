from typing import List, Optional
from pydantic import BaseModel, Field


class CurrencyContext(BaseModel):
    code: Optional[str] = None
    symbol: Optional[str] = None
    decimalSeparator: Optional[str] = None
    thousandsSeparator: Optional[str] = None


class DocumentContext(BaseModel):
    countryDetected: Optional[str] = None
    languageDetected: Optional[str] = None
    documentType: Optional[str] = None
    currency: Optional[CurrencyContext] = None


class NormalizedField(BaseModel):
    name: str
    rawLabel: Optional[str] = None
    rawValue: Optional[str] = None
    normalizedValue: Optional[str] = None
    confidence: Optional[float] = None


class ExtraField(BaseModel):
    rawLabel: Optional[str] = None
    rawValue: Optional[str] = None
    confidence: Optional[float] = None


class LineItem(BaseModel):
    lineNumber: int
    article: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None
    lineSubtotal: Optional[float] = None
    lineTax: Optional[float] = None
    lineTotal: Optional[float] = None
    taxIncluded: Optional[bool] = None
    confidence: Optional[float] = None


class Totals(BaseModel):
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    taxIncludedInPrices: Optional[bool] = None


class OCRProcessResponse(BaseModel):
    success: bool
    processStatus: str
    rawText: Optional[str] = None
    confidenceAvg: Optional[float] = None
    documentContext: Optional[DocumentContext] = None
    normalizedFields: List[NormalizedField] = Field(default_factory=list)
    extraFields: List[ExtraField] = Field(default_factory=list)
    items: List[LineItem] = Field(default_factory=list)
    totals: Optional[Totals] = None
    errorMessage: Optional[str] = None