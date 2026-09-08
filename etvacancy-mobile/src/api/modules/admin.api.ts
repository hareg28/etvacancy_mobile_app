import { apiClient } from '../client';
import type { AnalyticsData, Job, PaginatedResponse, Permission } from '@/types/index';

export const admin = {
  analytics: () => apiClient.get<AnalyticsData>('/admin/analytics').then((r) => r.data),
  permissions: {
    list: () => apiClient.get<Permission[]>('/admin/permissions').then((r) => r.data),
    create: (data: Partial<Permission>) =>
      apiClient.post<Permission>('/admin/permissions', data).then((r) => r.data),
    update: (id: string, data: Partial<Permission>) =>
      apiClient.patch<Permission>(`/admin/permissions/${id}`, data).then((r) => r.data),
    delete: (id: string) =>
      apiClient.delete<void>(`/admin/permissions/${id}`).then((r) => r.data),
  },
  reports: {
    generate: (type: string, params?: Record<string, unknown>) =>
      apiClient.post<{ url: string; filename: string }>(`/admin/reports/${type}`, params).then((r) => r.data),
    list: () => apiClient.get<Array<{ id: string; type: string; createdAt: string }>>('/admin/reports').then((r) => r.data),
  },
  jobs: {
    list: (params?: { page?: number; limit?: number }) =>
      apiClient.get<PaginatedResponse<Job>>('/admin/jobs', { params }).then((r) => r.data),
    feature: (id: string, featured: boolean) =>
      apiClient.post<Job>(`/admin/jobs/${id}/feature`, { featured }).then((r) => r.data),
  },
};
