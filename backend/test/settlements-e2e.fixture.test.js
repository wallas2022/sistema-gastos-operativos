const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const s=fs.readFileSync('test/settlements-e2e.fixture.js','utf8');
test('fixture E2E asigna OCR_VIEW_COMPANY por RBAC real',()=>{assert.match(s,/rolePermission\.upsert/);assert.match(s,/user\.create/);assert.match(s,/OCR_VIEW_COMPANY/);assert.match(s,/ocrDocumentWhere\(actor\)/);});
