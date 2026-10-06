import { ForbiddenException } from '@nestjs/common';

export function hasPermission(user: any, permission: string): boolean {
  if (!user) {
    return false;
  }

  /*
   * Desbloqueo administrativo inicial.
   * Esto permite que el usuario con role ADMIN pueda entrar al módulo
   * de seguridad aunque todavía no tenga permisos cargados en UserRole/RolePermission.
   */
  if (user.role === 'ADMIN') {
    return true;
  }

  return (
    Array.isArray(user.permissions) &&
    user.permissions.includes(permission)
  );
}

export function requirePermission(user: any, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenException(
      `No tiene permiso para ejecutar esta acción: ${permission}`,
    );
  }
}
/** Resolve a client filter against the authenticated scope; missing company fails closed. */
export function authorizedCompanyId(user: any, requested?: string, globalPermission = 'EXPENSE_REQUEST_VIEW_ALL'): string | undefined {
  if (!user?.id) throw new ForbiddenException('Usuario no autenticado.');
  if (user.role === 'ADMIN' || (globalPermission && hasPermission(user, globalPermission))) return requested || undefined;
  if (!user.companyId || (requested && requested !== user.companyId)) throw new ForbiddenException('No tiene acceso a esta empresa.');
  return user.companyId;
}

/** OCR scope comes from persisted read permissions, never from fiscal extraction. */
export function ocrDocumentWhere(user: any): import('@prisma/client').Prisma.DocumentWhereInput {
  if (!user?.id) throw new ForbiddenException('Usuario no autenticado.');
  if (user.role === 'ADMIN' || hasPermission(user, 'OCR_VIEW_ALL')) return {};
  if (!user.companyId) throw new ForbiddenException('El usuario no tiene empresa asignada.');
  const company = { user: { companyId: user.companyId } };
  const process = { AND: [
    { OR: [{ expenseRequestId: null }, { expenseRequest: { companyId: user.companyId } }] },
    { OR: [{ settlementItem: null }, { settlementItem: { settlement: { companyId: user.companyId } } }] },
  ] };
  if (hasPermission(user, 'OCR_VIEW_COMPANY')) return { AND: [company, process] };
  if (hasPermission(user, 'OCR_VIEW_OWN')) return { AND: [company, process, { userId: user.id }] };
  throw new ForbiddenException('No tiene permiso para consultar documentos OCR.');
}

export async function authorizedRequestWhere(prisma: any, user: any): Promise<import('@prisma/client').Prisma.ExpenseRequestWhereInput> {
  const companyId = authorizedCompanyId(user);
  if (user.role === 'ADMIN' || hasPermission(user, 'EXPENSE_REQUEST_VIEW_ALL')) return {};
  if (hasPermission(user, 'EXPENSE_REQUEST_VIEW_COMPANY')) return { companyId };
  if (hasPermission(user, 'EXPENSE_REQUEST_VIEW_TEAM')) {
    const team = await prisma.user.findMany({ where: { managerId: user.id, companyId }, select: { id: true } });
    return { companyId, requesterId: { in: [user.id, ...team.map((member: any) => member.id)] } };
  }
  if (hasPermission(user, 'EXPENSE_REQUEST_VIEW_OWN')) return { companyId, requesterId: user.id };
  return { OR: [] };
}
