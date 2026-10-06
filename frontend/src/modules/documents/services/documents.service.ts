import { api } from "../../../shared/services/api";

export interface DocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  status: string;
  userId: string;
  expenseRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
  ocrResult?: OcrResultData | null;
  confirmation?: any | null;
}

export interface OcrField {
  id: string;
  fieldName: string;
  rawLabel?: string | null;
  detectedValue?: string | null;
  normalizedValue?: string | null;
  finalValue?: string | null;
  confidence?: number | string | null;
  wasCorrected?: boolean;
  sourceBlock?: string | null;
  extractionRule?: string | null;
  corrections?: { id: string; ocrValue?: string | null; previousValue?: string | null; finalValue: string; reason?: string | null; createdAt: string; user: { id: string; name: string; email: string } }[];
}

export interface OcrExtraField {
  id: string;
  rawLabel?: string | null;
  rawValue?: string | null;
  confidence?: number | string | null;
}

export interface OcrLineItem {
  id: string;
  lineNumber: number;
  article?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  lineSubtotal?: number | string | null;
  lineTax?: number | string | null;
  lineTotal?: number | string | null;
  taxIncluded?: boolean | null;
  confidence?: number | string | null;
}

export interface OcrResultData {
  id: string;
  documentId: string;
  extractedText?: string | null;
  averageConfidence?: number | string | null;
  processStatus?: string | null;
  errorMessage?: string | null;

  countryDetected?: string | null;
  languageDetected?: string | null;
  documentTypeDetected?: string | null;

  currencyCode?: string | null;
  currencySymbol?: string | null;
  decimalSeparator?: string | null;
  thousandsSeparator?: string | null;

  subtotalAmount?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
  taxIncludedInPrices?: boolean | null;
  processingDurationMs?: number | null;
  reviewStartedAt?: string | null;
  confirmedAt?: string | null;
  modificationCount?: number;
  validationRuns?: unknown[];
  detectedVoucherType?: string | null;
  finalVoucherType?: string | null;
  receiverTaxId?: string | null;
  receiverName?: string | null;
  receiverTradeName?: string | null;
  receiverType?: string;
  fiscalCompanyId?: string | null;
  fiscalCompanyTaxId?: string | null;
  fiscalCompanyLegalName?: string | null;
  fiscalCompanyTradeName?: string | null;
  fiscalCompanyIdentifiedAt?: string | null;
  fiscalCompanyIdentificationMethod?: string | null;
  fiscalCompanyIdentificationStatus?: string;
  fiscalCompanyWarning?: string | null;
  fiscalCompany?: { id: string; code: string; name: string; legalName?: string | null; tradeName?: string | null; taxId?: string | null } | null;
  complianceResult?: string | null;
  complianceReason?: string | null;
  eligibleForSettlement?: boolean;
  usedInSettlement?: boolean;
  complianceDecisions?: ComplianceDecision[];

  extractedFields?: OcrField[];
  extractedExtraFields?: OcrExtraField[];
  extractedLineItems?: OcrLineItem[];
}

export interface OcrResultResponse {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  ocrResult?: OcrResultData | null;
  confirmation?: any | null;
}export interface UpdateLineItemPayload {
  id?: string;
  lineNumber: number;
  article?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal?: number | null;
  lineTax?: number | null;
  lineTotal: number;
  taxIncluded?: boolean | null;
  confidence?: number | null;
}
export type OcrResult = OcrResultResponse;

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export async function getDocuments(page = 1, pageSize = 10) {
  const response = await api.get("/documents", {
    params: {
      page,
      pageSize,
    },
  });

  return response.data;
}

export const getDocumentById = async (id: string): Promise<OcrResultResponse> => {
  const response = await api.get(`/ocr/${id}/result`);
  return response.data;
};

export const updateOcrFields = async (
  id: string,
  fields: { id: string; fieldValue: string; confidence?: number | null; reason?: string }[]
) => {
  const response = await api.put(`/ocr/${id}/fields`, { fields });
  return response.data;
};

export const updateOcrTotal = async (id: string, total: string, reason: string) => {
  const response = await api.put(`/ocr/${id}/total`, { total, reason });
  return response.data;
};

export const confirmOcrDocument = async (id: string, comment?: string) => {
  const response = await api.post(`/ocr/${id}/confirm`, { comment });
  return response.data;
};

export const processOcrDocument = async (id: string) => {
  const response = await api.post(`/ocr/${id}`);
  return response.data;
};

export const getDocumentFileUrl = (id: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return `${baseUrl}/documents/${id}/file`;
};

export const processOcr = async (documentId: string) => {
  const response = await api.post(`/ocr/${documentId}/process`);
  return response.data;
};



export const getDocumentFileBlob = async (id: string): Promise<Blob> => {
  const response = await api.get(`/documents/${id}/file`, {
    responseType: "blob",
  });

  return response.data as Blob;
};
export const isPdfMime = (mimeType?: string | null) =>
  (mimeType || "").toLowerCase().includes("pdf");

export const isImageMime = (mimeType?: string | null) =>
  (mimeType || "").toLowerCase().startsWith("image/");

export const buildObjectUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export async function updateOcrLineItems(
  documentId: string,
  items: UpdateLineItemPayload[],
) {
  const response = await api.put(`/ocr/${documentId}/items`, {
    items,
  });

  return response.data;
}
export interface ComplianceDecision { id: string; documentType: string; expectedTaxId?: string | null; foundTaxId?: string | null; receiverName?: string | null; receiverType: string; receiverConfidence?: number | string | null; appliedRule: string; appliedPolicyCode?: string | null; appliedPolicyName?: string | null; result: string; reason: string; actorName: string; createdAt: string; }
