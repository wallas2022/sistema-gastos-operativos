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