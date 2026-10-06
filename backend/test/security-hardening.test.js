const test = require('node:test');
const assert = require('node:assert/strict');
const { ExpenseRequestPaymentsService } = require('../dist/src/modules/expense-request-payments/expense-request-payments.service');
const { OcrService } = require('../dist/src/modules/ocr/ocr.service');

test('payment resource access rejects a different company and allows finance in same company', async () => {
  const prisma = { expenseRequest: { findUnique: async () => ({ requesterId: 'owner-a', companyId: 'company-b' }) } };
  const service = new ExpenseRequestPaymentsService(prisma, {});
  await assert.rejects(() => service.assertRequestAccess('request-b', { id: 'user-a', role: 'FINANZAS', companyId: 'company-a' }), { name: 'NotFoundException' });
  await assert.doesNotReject(() => service.assertRequestAccess('request-b', { id: 'finance-b', role: 'FINANZAS', companyId: 'company-b' }));
});

test('OCR read permission cannot be used for processing', async () => {
  const prisma = { user: { findUnique: async () => ({ companyId: 'company-a' }) } };
  const service = new OcrService(prisma, {}, {}, {});
  await assert.rejects(() => service.assertDocumentAccess({ userId: 'owner', id: 'doc-1' }, { id: 'owner', role: 'SOLICITANTE', companyId: 'company-a', permissions: ['OCR_VIEW_OWN'] }, 'process'), { name: 'ForbiddenException' });
});

test('Documents service source uses an explicit safe user projection', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/modules/documents/documents.service.ts'), 'utf8');
  assert.equal(source.includes('include: { user: true'), false);
  assert.match(source, /user: \{ select: \{ id: true, name: true, email: true/);
});
const { authorizedCompanyId, ocrDocumentWhere } = require('../dist/src/modules/auth/permissions.util');
const { ReportsService } = require('../dist/src/modules/reports/reports.service');
const { DocumentsService } = require('../dist/src/modules/documents/documents.service');
const { SettlementsService } = require('../dist/src/modules/settlements/settlements.service');
const { TraceabilityService } = require('../dist/src/modules/traceability/traceability.service');
const actor = { id: 'a', role: 'FINANZAS', companyId: 'A', permissions: ['REPORTS_VIEW', 'OCR_VIEW_COMPANY', 'TRACEABILITY_VIEW'] };

test('company scope rejects arbitrary company and missing company', () => {
  assert.equal(authorizedCompanyId(actor), 'A');
  assert.throws(() => authorizedCompanyId(actor, 'B'), { name: 'ForbiddenException' });
  for (const companyId of [undefined, null, '']) assert.throws(() => authorizedCompanyId({ ...actor, companyId }), { name: 'ForbiddenException' });
  assert.equal(authorizedCompanyId({ ...actor, permissions: ['EXPENSE_REQUEST_VIEW_ALL'] }, 'B'), 'B');
  assert.equal(authorizedCompanyId({ ...actor, role: 'ADMIN', companyId: null }), undefined);
});
for (const kind of ['requests', 'budget', 'approvals', 'policies', 'executive', 'ocr']) {
  test(`report and export ${kind} reject a foreign company before any query`, async () => {
    const service = new ReportsService({}, {}, {});
    await assert.rejects(() => service[kind]({ companyId: 'B' }, actor), { name: 'ForbiddenException' });
    await assert.rejects(() => service.exportPayload(kind, { companyId: 'B' }, actor), { name: 'ForbiddenException' });
    await assert.rejects(() => service.exportPayload(kind, {}, { ...actor, permissions: [] }), { name: 'ForbiddenException' });
  });
}
test('query and export pass the same authorized company to the repository', async () => {
  const queries = [];
  const repo = { requests: async f => { queries.push(f); return []; }, countRequests: async () => 0 };
  const service = new ReportsService(repo, {}, {});
  await service.requests({ page: 1, pageSize: 10 }, actor);
  await service.exportPayload('requests', { page: 1, pageSize: 10 }, actor);
  assert.deepEqual(queries[0], queries[1]);
  assert.equal(queries[0].companyId, 'A');
});
test('denied download never calls storage', async () => {
  let calls = 0;
  const service = new DocumentsService({ document: { findFirst: async () => null } }, { getFileBuffer: async () => { calls++; } }, {});
  assert.equal(await service.getFileStream('foreign', actor), null);
  assert.equal(calls, 0);
});
test('allowed download accesses storage only after the scoped lookup', async () => {
  const order = [];
  const service = new DocumentsService({ document: { findFirst: async ({where}) => { order.push('authorize'); assert.ok(where.AND); return {storagePath:'allowed',mimeType:'application/pdf',fileName:'a.pdf'}; } } }, { getFileBuffer: async key => {order.push(key);return Buffer.from('pdf');} }, {});
  assert.equal((await service.getFileStream('a', actor)).buffer.toString(), 'pdf');
  assert.deepEqual(order, ['authorize', 'allowed']);
});
for (const [operation, permission] of [['process','OCR_PROCESS'],['correct','OCR_REVIEW'],['confirm','OCR_CONFIRM']]) {
  test(`OCR ${operation} requires its own permission, including privileged role names`, async () => {
    const service = new OcrService({ document: { findFirst: async () => ({ id:'a' }) } }, {}, {}, {});
    for (const wrong of ['OCR_VIEW_COMPANY', 'OCR_PROCESS','OCR_REVIEW','OCR_CONFIRM'].filter(p=>p!==permission)) {
      await assert.rejects(() => service.assertDocumentAccess({id:'a'}, {...actor, permissions:['OCR_VIEW_COMPANY',wrong]}, operation), {name:'ForbiddenException'});
    }
    await assert.doesNotReject(() => service.assertDocumentAccess({id:'a'}, {...actor,permissions:['OCR_VIEW_COMPANY',permission]},operation));
  });
}
test('OCR metrics without read permission fails before any aggregate', async () => {
  await assert.rejects(() => new OcrService({}, {}, {}, {}).metrics({...actor,permissions:[]}), {name:'ForbiddenException'});
  assert.throws(() => ocrDocumentWhere({...actor,companyId:undefined}), {name:'ForbiddenException'});
});
for (const action of ['observe','reject','approve','close','certify']) {
  test(`foreign settlement ${action} is denied before a write`, async () => {
    const service = new SettlementsService({}, {}, {}, {}, {});
    service.getInternal = async () => ({companyId:'B',expenseRequest:{requesterId:'b'}});
    await assert.rejects(() => action==='close'||action==='certify' ? service[action]('b',actor) : service[action]('b','test',actor), {name:'ForbiddenException'});
  });
}
test('traceability rejects foreign entity before fetching its history or changing it', async () => {
  const service = new TraceabilityService({expenseRequest:{findFirst:async()=>null}}, {}, {});
  await assert.rejects(()=>service.getEventLogsByRequest('b',actor), {name:'NotFoundException'});
  await assert.rejects(()=>service.approve('b','test',actor), {name:'NotFoundException'});
});
