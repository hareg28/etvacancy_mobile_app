import { apiClient } from '../client';
import type { AuthResponse, PaginatedResponse, User } from '@/types/index';

export const users = {
  list: (params?: { page?: number; limit?: number; role?: string; query?: string; isActive?: boolean }) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/users/${id}`).then((r) => r.data),
  activate: (id: string) => apiClient.post<User>(`/users/${id}/activate`).then((r) => r.data),
  deactivate: (id: string) => apiClient.post<User>(`/users/${id}/deactivate`).then((r) => r.data),
  impersonate: (id: string) =>
    apiClient.post<AuthResponse>(`/users/${id}/impersonate`).then((r) => r.data),
  export: (params?: Record<string, unknown>) =>
    apiClient.get<Blob>('/users/export', { params, responseType: 'blob' }).then((r) => r.data),
};
