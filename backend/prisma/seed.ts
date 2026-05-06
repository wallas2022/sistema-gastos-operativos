import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed demo...');

  const passwordHash = await bcrypt.hash('Demo12345*', 10);

  /**
   * 1. País Guatemala
   */
  const guatemala = await prisma.country.upsert({
    where: { code: 'GT' },
    update: {
      name: 'Guatemala',
      active: true,
    },
    create: {
      code: 'GT',
      name: 'Guatemala',
      active: true,
    },
  });

  /**
   * 2. Moneda GTQ
   * Tu modelo Currency tiene countries: Country[],
   * por eso se usa connect en countries.
   */
  const gtq = await prisma.currency.upsert({
    where: { code: 'GTQ' },
    update: {
      name: 'Quetzal',
      symbol: 'Q',
      active: true,
      countries: {
        connect: {
          id: guatemala.id,
        },
      },
    },
    create: {
      code: 'GTQ',
      name: 'Quetzal',
      symbol: 'Q',
      active: true,
      countries: {
        connect: {
          id: guatemala.id,
        },
      },
    },
  });

  /**
   * 3. Empresa principal para demo
   */
  const company = await prisma.company.upsert({
    where: { code: 'SSC-GT' },
    update: {
      name: 'Servicios Compartidos S.A.',
      countryId: guatemala.id,
      currencyId: gtq.id,
      active: true,
    },
    create: {
      code: 'SSC-GT',
      name: 'Servicios Compartidos S.A.',
      countryId: guatemala.id,
      currencyId: gtq.id,
      active: true,
    },
  });

  /**
   * 4. Usuario ADMIN
   */
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      name: 'Administrador Demo',
      passwordHash,
      role: RoleName.ADMIN,
      active: true,
      companyId: company.id,
      managerId: null,
      costCenter: 'ADM-ROOT',
      position: 'Administrador del Sistema',
    },
    create: {
      name: 'Administrador Demo',
      email: 'admin@demo.com',
      passwordHash,
      role: RoleName.ADMIN,
      active: true,
      companyId: company.id,
      costCenter: 'ADM-ROOT',
      position: 'Administrador del Sistema',
    },
  });

  /**
   * 5. Usuario FINANZAS
   */
  const finanzas = await prisma.user.upsert({
    where: { email: 'finanzas@demo.com' },
    update: {
      name: 'Finanzas Demo',
      passwordHash,
      role: RoleName.FINANZAS,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'FIN-001',
      position: 'Analista Financiero',
    },
    create: {
      name: 'Finanzas Demo',
      email: 'finanzas@demo.com',
      passwordHash,
      role: RoleName.FINANZAS,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'FIN-001',
      position: 'Analista Financiero',
    },
  });

  /**
   * 6. Usuario TESORERIA
   */
  await prisma.user.upsert({
    where: { email: 'tesoreria@demo.com' },
    update: {
      name: 'Tesorería Demo',
      passwordHash,
      role: RoleName.TESORERIA,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'TES-001',
      position: 'Analista de Tesorería',
    },
    create: {
      name: 'Tesorería Demo',
      email: 'tesoreria@demo.com',
      passwordHash,
      role: RoleName.TESORERIA,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'TES-001',
      position: 'Analista de Tesorería',
    },
  });

  /**
   * 7. Usuario REVISOR OCR
   */
  await prisma.user.upsert({
    where: { email: 'revisor.ocr@demo.com' },
    update: {
      name: 'Revisor OCR Demo',
      passwordHash,
      role: RoleName.REVISOR_OCR,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'DOC-001',
      position: 'Revisor Documental OCR',
    },
    create: {
      name: 'Revisor OCR Demo',
      email: 'revisor.ocr@demo.com',
      passwordHash,
      role: RoleName.REVISOR_OCR,
      active: true,
      companyId: company.id,
      managerId: admin.id,
      costCenter: 'DOC-001',
      position: 'Revisor Documental OCR',
    },
  });

  /**
   * 8. Usuario GERENTE
   * Este será el jefe inmediato del solicitante.
   */
  const gerente = await prisma.user.upsert({
    where: { email: 'gerente@demo.com' },
    update: {
      name: 'Gerente Demo',
      passwordHash,
      role: RoleName.GERENTE,
      active: true,
      companyId: company.id,
      managerId: finanzas.id,
      costCenter: 'GER-001',
      position: 'Gerente de Área',
    },
    create: {
      name: 'Gerente Demo',
      email: 'gerente@demo.com',
      passwordHash,
      role: RoleName.GERENTE,
      active: true,
      companyId: company.id,
      managerId: finanzas.id,
      costCenter: 'GER-001',
      position: 'Gerente de Área',
    },
  });

  /**
   * 9. Usuario SOLICITANTE
   * Reporta al gerente.
   */
  await prisma.user.upsert({
    where: { email: 'solicitante@demo.com' },
    update: {
      name: 'Walter Solicitante',
      passwordHash,
      role: RoleName.SOLICITANTE,
      active: true,
      companyId: company.id,
      managerId: gerente.id,
      costCenter: 'CC-TI-001',
      position: 'Operador',
    },
    create: {
      name: 'Walter Solicitante',
      email: 'solicitante@demo.com',
      passwordHash,
      role: RoleName.SOLICITANTE,
      active: true,
      companyId: company.id,
      managerId: gerente.id,
      costCenter: 'CC-TI-001',
      position: 'Operador',
    },
  });

  /**
   * 10. Segundo solicitante para probar seguridad
   * Este usuario sirve para validar que un solicitante
   * no pueda ver solicitudes ni OCR de otro usuario.
   */
  await prisma.user.upsert({
    where: { email: 'solicitante2@demo.com' },
    update: {
      name: 'Solicitante Dos Demo',
      passwordHash,
      role: RoleName.SOLICITANTE,
      active: true,
      companyId: company.id,
      managerId: gerente.id,
      costCenter: 'CC-ADM-002',
      position: 'Asistente Administrativo',
    },
    create: {
      name: 'Solicitante Dos Demo',
      email: 'solicitante2@demo.com',
      passwordHash,
      role: RoleName.SOLICITANTE,
      active: true,
      companyId: company.id,
      managerId: gerente.id,
      costCenter: 'CC-ADM-002',
      position: 'Asistente Administrativo',
    },
  });

  /**
   * 11. Serie documental para solicitudes de gasto
   */
  await prisma.documentSeries.upsert({
    where: {
      companyId_documentType_year: {
        companyId: company.id,
        documentType: 'SOLICITUD_GASTO',
        year: 2026,
      },
    },
    update: {
      prefix: 'GT-SOL',
      padding: 4,
      active: true,
    },
    create: {
      companyId: company.id,
      documentType: 'SOLICITUD_GASTO',
      prefix: 'GT-SOL',
      currentNumber: 0,
      padding: 4,
      year: 2026,
      active: true,
    },
  });

  /**
   * 12. Permisos del módulo de seguridad
   */
  const securityPermissions = [
    { code: 'SECURITY_USERS_READ',        name: 'Ver usuarios',             module: 'security', action: 'users_read' },
    { code: 'SECURITY_USERS_WRITE',       name: 'Crear/editar usuarios',    module: 'security', action: 'users_write' },
    { code: 'SECURITY_ROLES_READ',        name: 'Ver roles',                module: 'security', action: 'roles_read' },
    { code: 'SECURITY_ROLES_WRITE',       name: 'Crear/editar roles',       module: 'security', action: 'roles_write' },
    { code: 'SECURITY_PERMISSIONS_READ',  name: 'Ver permisos',             module: 'security', action: 'permissions_read' },
    { code: 'SECURITY_PERMISSIONS_WRITE', name: 'Crear/editar permisos',    module: 'security', action: 'permissions_write' },
    { code: 'SECURITY_ASSIGNMENTS_WRITE', name: 'Asignar roles y permisos', module: 'security', action: 'assignments_write' },
    { code: 'SECURITY_MATRIX_READ',       name: 'Ver matriz de acceso',     module: 'security', action: 'matrix_read' },
  ];

  const createdPermissions = await Promise.all(
    securityPermissions.map((p) =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: { name: p.name, active: true },
        create: { ...p, active: true },
      }),
    ),
  );

  /**
   * 13. Rol ADMIN en el nuevo sistema de roles
   */
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: { name: 'Administrador', active: true },
    create: { code: 'ADMIN', name: 'Administrador', description: 'Acceso total al sistema', active: true },
  });

  /**
   * 14. Asignar todos los permisos de seguridad al rol ADMIN
   */
  await Promise.all(
    createdPermissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      }),
    ),
  );

  /**
   * 15. Asignar rol ADMIN al usuario admin
   */
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('Seed demo ejecutado correctamente.');
  console.log('');
  console.log('Usuarios disponibles para demo:');
  console.table([
    {
      usuario: 'admin@demo.com',
      rol: 'ADMIN',
      password: 'Demo12345*',
    },
    {
      usuario: 'solicitante@demo.com',
      rol: 'SOLICITANTE',
      password: 'Demo12345*',
    },
    {
      usuario: 'solicitante2@demo.com',
      rol: 'SOLICITANTE',
      password: 'Demo12345*',
    },
    {
      usuario: 'gerente@demo.com',
      rol: 'GERENTE',
      password: 'Demo12345*',
    },
    {
      usuario: 'finanzas@demo.com',
      rol: 'FINANZAS',
      password: 'Demo12345*',
    },
    {
      usuario: 'tesoreria@demo.com',
      rol: 'TESORERIA',
      password: 'Demo12345*',
    },
    {
      usuario: 'revisor.ocr@demo.com',
      rol: 'REVISOR_OCR',
      password: 'Demo12345*',
    },
  ]);
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });