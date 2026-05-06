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