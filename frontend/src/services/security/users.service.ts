import { api } from "../../shared/services/api";


export type SecurityUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  blocked?: boolean;
  forcePasswordChange?: boolean;
  costCenter?: string | null;
  position?: string | null;
  companyId?: string | null;
  managerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles?: {
    role: {
      id: string;
      code: string;
      name: string;
    };
  }[];
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  companyId?: string;
  costCenter?: string;
  position?: string;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  companyId?: string;
  costCenter?: string;
  position?: string;
  isActive?: boolean;
};

export const getUsers = async () => {
  const response = await api.get<SecurityUser[]>("/security/users");
  return response.data;
};

export const createUser = async (data: CreateUserPayload) => {
  const response = await api.post<SecurityUser>("/security/users", data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserPayload) => {
  const response = await api.patch<SecurityUser>(`/security/users/${id}`, data);
  return response.data;
};

export const activateUser = async (id: string) => {
  const response = await api.patch<SecurityUser>(`/security/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id: string) => {
  const response = await api.patch<SecurityUser>(`/security/users/${id}/deactivate`);
  return response.data;
};

export const blockUser = async (id: string) => (await api.patch(`/security/users/${id}/block`)).data;
export const unblockUser = async (id: string) => (await api.patch(`/security/users/${id}/unblock`)).data;
export const forcePasswordChange = async (id: string) => (await api.patch(`/security/users/${id}/force-password-change`)).data;
export const generatePasswordResetLink = async (id: string) => (await api.post(`/security/users/${id}/password-reset-link`)).data as { resetUrl: string; expiresMinutes: number };
export const adminResetPassword = async (id: string) => (await api.post(`/security/users/${id}/reset-password`, { forceChange: true })).data as { temporaryPassword: string };
