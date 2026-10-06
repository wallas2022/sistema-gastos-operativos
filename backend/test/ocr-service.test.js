const test = require('node:test');
const assert = require('node:assert/strict');
const { OcrService } = require('../dist/src/modules/ocr/ocr.service');

function harness(result) {
  const statusUpdates = [];
  let persistedResult;
  const prisma = {
    document: {
      findUnique: async () => ({
        id: 'document-id', userId: 'owner-id', storagePath: 'documents/test.png',
        fileName: 'test.png', mimeType: 'image/png', ocrResult: null,
      }),
      update: async ({ data }) => { if (data.status) statusUpdates.push(data.status); return {}; },
    },
    oCRResult: {
      create: async ({ data }) => { persistedResult = data; return { id: 'ocr-result-id' }; },
      update: async ({ data }) => { persistedResult = { ...persistedResult, ...data }; return { id: 'ocr-result-id' }; },
    },
    extractedField: { createMany: async () => {} },
    extractedExtraField: { createMany: async () => {} },
    extractedLineItem: { createMany: async () => {} },
    $transaction: async (operations) => Array.isArray(operations) ? Promise.all(operations) : operations(prisma),
  };
  const client = { processFile: async () => result };
  const storage = { getFileBuffer: async () => Buffer.from('image') };
  return { service: new OcrService(prisma, client, storage), statusUpdates, getPersisted: () => persistedResult };
}

test('ERROR_OCR is persisted and never becomes PENDIENTE_REVISION', async () => {
  const fixture = harness({
    success: false, processStatus: 'ERROR_OCR', errorMessage: 'No text',
    metrics: { processingDurationMs: 125, pageCount: 1, ocrPageCount: 1, directTextPageCount: 0, retryCount: 1, engineVersion: '3.7.0' },
  });
  const response = await fixture.service.processDocument('document-id', { role: 'ADMIN', id: 'admin' });
  assert.deepEqual(fixture.statusUpdates, ['PROCESANDO', 'ERROR_OCR']);
  assert.equal(response.ok, false);
  assert.equal(fixture.getPersisted().processStatus, 'ERROR_OCR');
  assert.equal(fixture.getPersisted().processingDurationMs, 125);
});

test('successful OCR becomes PENDIENTE_REVISION and stores real confidence', async () => {
  const fixture = harness({
    success: true, processStatus: 'PROCESADO', confidenceAvg: 98.03,
    normalizedFields: [], extraFields: [], items: [], totals: {},
    metrics: { pageCount: 2, ocrPageCount: 2, processingDurationMs: 500 },
  });
  const response = await fixture.service.processDocument('document-id', { role: 'ADMIN', id: 'admin' });
  assert.deepEqual(fixture.statusUpdates, ['PROCESANDO', 'PENDIENTE_REVISION']);
  assert.equal(response.ok, true);
  assert.equal(fixture.getPersisted().averageConfidence, 98.03);
  assert.equal(fixture.getPersisted().pageCount, 2);
  assert.equal(fixture.getPersisted().processStatus, 'PENDIENTE_REVISION');
});
