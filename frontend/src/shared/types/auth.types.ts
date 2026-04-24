export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'REVISOR_OCR' | 'SOLICITANTE';
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}