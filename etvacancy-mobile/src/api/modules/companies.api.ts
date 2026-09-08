import { apiClient } from '../client';
import type { Company, Job, PaginatedResponse } from '@/types/index';

export const companies = {
  list: (params?: { page?: number; limit?: number; query?: string; industry?: string; verified?: boolean }) =>
    apiClient.get<PaginatedResponse<Company>>('/companies', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Company>(`/companies/${id}`).then((r) => r.data),
  create: (data: Partial<Company>) => apiClient.post<Company>('/companies', data).then((r) => r.data),
  update: (id: string, data: Partial<Company>) =>
    apiClient.patch<Company>(`/companies/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/companies/${id}`).then((r) => r.data),
  verify: (id: string) => apiClient.post<Company>(`/companies/${id}/verify`).then((r) => r.data),
  jobs: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Job>>(`/companies/${id}/jobs`, { params }).then((r) => r.data),
  stats: (id: string) => apiClient.get<Record<string, number>>(`/companies/${id}/stats`).then((r) => r.data),
};
