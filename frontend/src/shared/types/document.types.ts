export type DocumentStatus =
  | 'CARGADO'
  | 'PROCESANDO'
  | 'PROCESADO'
  | 'PENDIENTE_REVISION'
  | 'CONFIRMADO'
  | 'ERROR_OCR';

export interface DocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number | string;
  status: DocumentStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}