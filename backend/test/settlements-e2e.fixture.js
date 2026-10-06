const { ocrDocumentWhere } = require('../dist/src/modules/auth/permissions.util');

/** Creates an isolated fixture identity using the application's real RBAC relations. */
async function createOcrFixtureIdentity(prisma, { companyId, suffix = Date.now() }) {
  const role = await prisma.role.upsert({ where: { code: `E2E_OCR_${suffix}` }, update: { active: true }, create: { code: `E2E_OCR_${suffix}`, name: 'E2E OCR company reader', active: true } });
  const permission = await prisma.permission.upsert({ where: { code: 'OCR_VIEW_COMPANY' }, update: { active: true }, create: { code: 'OCR_VIEW_COMPANY', name: 'OCR company view', module: 'OCR', action: 'VIEW_COMPANY', active: true } });
  await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
  const user = await prisma.user.create({ data: { email: `e2e-ocr-${suffix}@test.local`, name: 'E2E OCR Reader', passwordHash: 'E2E_ONLY', role: 'FINANZAS', companyId, roles: { create: { roleId: role.id } } } });
  const actor = { id: user.id, role: user.role, companyId, permissions: ['OCR_VIEW_COMPANY'] };
  ocrDocumentWhere(actor);
  return { role, permission, user, actor };
}
module.exports = { createOcrFixtureIdentity };
