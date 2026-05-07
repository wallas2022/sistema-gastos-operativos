import {api} from "../shared/services/api";

export type SecurityUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  companyId?: string | null;
  managerId?: string | null;
  costCenter?: string | null;
  position?: string | null;
  createdAt?: string;
  roles?: Array<{
    id: string;
    role: {
      id: string;
      code: string;
      name: string;
      description?: string | null;
      active: boolean;
    };
  }>;
};

export type SecurityRole = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  permissions?: Array<{
    id: string;
    permission: SecurityPermission;
  }>;
  users?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};



export type SecurityPermission = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module: string;
  action: string;
  active: boolean;
};

export type AccessMatrixResponse = {
  roles: Array<{
    id: string;
    code: string;
    name: string;
    permissions: Record<string, Record<string, boolean>>;
  }>;
  permissions: Array<{
    id: string;
    code: string;
    name: string;
    module: string;
    action: string;
  }>;
};

export async function getSecurityUsers() {
  const response = await api.get<SecurityUser[]>("/security/users");
  return response.data;
}

export async function createSecurityRole(payload: CreateRolePayload) {
  const response = await api.post("/security/roles", payload);
  return response.data;
}

export async function updateSecurityRole(roleId: string, payload: UpdateRolePayload) {
  const response = await api.patch(`/security/roles/${roleId}`, payload);
  return response.data;
}

export async function getSecurityRoles() {
  const response = await api.get<SecurityRole[]>("/security/roles");
  return response.data;
}

export async function getSecurityPermissions() {
  const response = await api.get<SecurityPermission[]>("/security/permissions");
  return response.data;
}

export async function getAccessMatrix() {
  const response = await api.get<AccessMatrixResponse>("/security/access-matrix");
  return response.data;
}

export async function assignRoleToUser(userId: string, roleId: string) {
  const response = await api.post(`/security/users/${userId}/roles/${roleId}`);
  return response.data;
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const response = await api.delete(`/security/users/${userId}/roles/${roleId}`);
  return response.data;
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  const response = await api.post(
    `/security/roles/${roleId}/permissions/${permissionId}`
  );
  return response.data;
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
) {
  const response = await api.delete(
    `/security/roles/${roleId}/permissions/${permissionId}`
  );
  return response.data;
}

export type CreateRolePayload = {
  code: string;
  name: string;
  description?: string;
};

export type UpdateRolePayload = {
  name?: string;
  description?: string;
  active?: boolean;
};

export type CreatePermissionPayload = {
  code: string;
  name: string;
  description?: string;
  module: string;
  action: string;
};

export type UpdatePermissionPayload = {
  name?: string;
  description?: string;
  module?: string;
  action?: string;
  active?: boolean;
};
export async function createSecurityPermission(payload: CreatePermissionPayload) {
  const response = await api.post("/security/permissions", payload);
  return response.data;
}

export async function updateSecurityPermission(
  permissionId: string,
  payload: UpdatePermissionPayload
) {
  const response = await api.patch(`/security/permissions/${permissionId}`, payload);
  return response.data;
}





