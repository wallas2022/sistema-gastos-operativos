const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { FunctionalTestsService } = require('../dist/src/modules/functional-tests/functional-tests.service');
const prisma = new PrismaClient();

test('registro funcional persiste casos y calcula resumen auditable', async (t) => {
  if (!process.env.DATABASE_URL) { t.skip('DATABASE_URL no configurada'); return; }
  const user = await prisma.user.findFirst({ where: { companyId: { not: null } }, select: { id: true, name: true, role: true, companyId: true } });
  if (!user) { t.skip('sin usuario de prueba'); return; }
  const service = new FunctionalTestsService(prisma); const actor = { ...user, permissions: [] }; const suffix = Date.now();
  const record = await service.create({ project: 'E2E-TEST-REGISTER', analystName: 'Analista', performedByName: 'Ejecutor', startedAt: new Date().toISOString(), comments: 'Registro de prueba' }, actor);
  const base = { requirementCode: `REQ-${suffix}`, requirementName: 'Gestión de usuarios', estimatedTime: '1 minuto' };
  const c1 = await service.addCase(record.id, { ...base, testDescription: 'Ingreso de usuario', acceptanceCriteria: 'El usuario puede ingresar' }, actor);
  const c2 = await service.addCase(record.id, { ...base, testDescription: 'Actualización de usuario', acceptanceCriteria: 'El usuario se actualiza' }, actor);
  const c3 = await service.addCase(record.id, { ...base, testDescription: 'Baja de usuario', acceptanceCriteria: 'El usuario se desactiva' }, actor);
  await service.execute(c1.id, { result: 'EXITOSA', observedResult: 'Acceso concedido' }, actor);
  await service.execute(c2.id, { result: 'NO_EXITOSA', observedResult: 'Actualización rechazada', observations: 'Validación pendiente' }, actor);
  const summary = await service.summary(record.id, actor);
  assert.deepEqual({ total: summary.total, performed: summary.performed, pending: summary.pending, successful: summary.successful, failed: summary.failed }, { total: 3, performed: 2, pending: 1, successful: 1, failed: 1 });
  assert.equal(summary.performedPercentage, 66.67); assert.equal(summary.successfulPercentage, 50);
  const row = await prisma.functionalTestRecord.findUnique({ where: { id: record.id }, include: { cases: true } }); assert.equal(row.cases.length, 3);
  const evidence = await prisma.document.findFirst({ where: { user: { companyId: user.companyId } }, select: { id: true } }); if (evidence) { const linked = await service.addEvidence(c1.id, evidence.id, actor); assert.equal(linked.documentId, evidence.id); }
  await assert.rejects(() => service.get(record.id, { ...actor, companyId: 'other-company' }));
  await service.execute(c3.id, { result: 'NO_APLICA', observedResult: 'No aplica' }, actor);
  await service.close(record.id, actor);
  await assert.rejects(() => service.addCase(record.id, { ...base, testDescription: 'No editar', acceptanceCriteria: 'Debe bloquear' }, actor));
  await prisma.functionalTestRecord.delete({ where: { id: record.id } }); await prisma.functionalRequirement.deleteMany({ where: { code: `REQ-${suffix}` } });
});
test.after(async () => { await prisma.$disconnect(); });
