import type { DocumentItem } from './document.types';

export interface ExtractedField {
  id: string;
  ocrResultId: string;
  fieldName: string;
  detectedValue?: string | null;
  finalValue?: string | null;
  confidence?: string | number | null;
  wasCorrected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OcrResult {
  id: string;
  documentId: string;
  extractedText?: string | null;
  averageConfidence?: string | number | null;
  processStatus: string;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  extractedFields: ExtractedField[];
}

export interface DocumentOcrDetail extends DocumentItem {
  ocrResult?: OcrResult | null;
}