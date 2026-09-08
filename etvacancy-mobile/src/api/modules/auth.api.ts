import { apiClient } from '../client';
import type { AuthResponse, RegisterData, User } from '@/types/index';

/**
 * Auth endpoints are handled by Better Auth (authClient).
 * Kept for backward compatibility for any legacy callers.
 */
export const auth = {
  /** @deprecated Use authClient.signIn.email() */
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  /** @deprecated Use authClient.signUp.email() */
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  /** @deprecated Use authClient.signOut() */
  logout: () => apiClient.post<void>('/auth/logout').then((r) => r.data),
  /** @deprecated Use authClient.getSession() */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),
  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
  /** @deprecated Use authClient.forgetPassword() */
  forgotPassword: (email: string) =>
    apiClient.post<void>('/auth/forgot-password', { email }).then((r) => r.data),
  /** @deprecated Use authClient.resetPassword() */
  resetPassword: (token: string, password: string) =>
    apiClient.post<void>('/auth/reset-password', { token, password }).then((r) => r.data),
  sendVerificationEmail: () =>
    apiClient.post<void>('/auth/send-verification').then((r) => r.data),
  verifyEmail: (token: string) =>
    apiClient.post<void>('/auth/verify-email', { token }).then((r) => r.data),
  oauth: (provider: string, code: string, redirectUri: string) =>
    apiClient.post<AuthResponse>(`/auth/oauth/${provider}`, { code, redirectUri }).then((r) => r.data),
};

/** @deprecated use `auth` — kept for backward compat */
export const authApi = auth;
