import { api } from "../../../../shared/services/api";
import type { LoginResponse } from '../../../../shared/types/auth.types';


export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/api/auth/login', {
    email,
    password,
  });

  return data;
}