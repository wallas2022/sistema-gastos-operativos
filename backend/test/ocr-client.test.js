const test = require('node:test');
const assert = require('node:assert/strict');
const { OcrClientService } = require('../dist/src/modules/ocr/ocr.client');

function config(values) {
  return { get: (key) => values[key] };
}

test('OCR client uses configured service URL and preserves the response contract', async () => {
  const originalFetch = global.fetch;
  let requestedUrl;
  global.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, json: async () => ({ success: true, processStatus: 'PROCESADO' }) };
  };
  try {
    const client = new OcrClientService(config({ 'ocr.baseUrl': 'http://ocr.internal:8123/', 'ocr.timeoutMs': 500 }));
    const result = await client.processFile(Buffer.from('invoice'), 'invoice.txt', 'text/plain');
    assert.equal(requestedUrl, 'http://ocr.internal:8123/process');
    assert.equal(result.processStatus, 'PROCESADO');
  } finally {
    global.fetch = originalFetch;
  }
});

test('OCR client aborts requests after the configured timeout', async () => {
  const originalFetch = global.fetch;
  global.fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  try {
    const client = new OcrClientService(config({ 'ocr.baseUrl': 'http://ocr.internal', 'ocr.timeoutMs': 10 }));
    await assert.rejects(
      () => client.processFile(Buffer.from('invoice'), 'invoice.txt', 'text/plain'),
      /excedió 10 ms/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
