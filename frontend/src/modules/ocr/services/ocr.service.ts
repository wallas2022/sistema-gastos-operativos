import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

export async function getOcrResult(documentId: string) {
  try {
    const { data } = await api.get(`/ocr/${documentId}/result`)
    return data
  } catch {
    return {
      id: documentId,
      fileName: 'factura_demo.pdf',
      status: 'PENDIENTE_REVISION',
      mimeType: 'application/pdf',
      ocrResult: {
        processStatus: 'PROCESADO',
        averageConfidence: '0.91',
        extractedText: 'Factura de demostración para OCR. NIT: 1234567-8. Total: Q 1,250.00',
        extractedFields: [
          { id: '1', fieldName: 'numero_documento', finalValue: 'FAC-001', detectedValue: 'FAC-001' },
          { id: '2', fieldName: 'nit', finalValue: '1234567-8', detectedValue: '1234567-8' },
          { id: '3', fieldName: 'total', finalValue: '1250.00', detectedValue: '1250.00' },
        ],
      },
    }
  }
}

export async function updateOcrFields(documentId: string, payload: { fields: any[] }) {
  try {
    const { data } = await api.put(`/ocr/${documentId}/fields`, payload)
    return data
  } catch {
    return { ok: true }
  }
}

export async function confirmOcrDocument(documentId: string) {
  try {
    const { data } = await api.post(`/ocr/${documentId}/confirm`)
    return data
  } catch {
    return { ok: true }
  }
}
