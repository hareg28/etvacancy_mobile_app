import { apiClient } from '../client';
import type { ApplicationAnswer, JobApplication, PaginatedResponse } from '@/types/index';

export const applications = {
  list: (params?: { page?: number; limit?: number; status?: string; jobId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
    apiClient
      .get<PaginatedResponse<JobApplication>>('/applications', { params })
      .then((r) => r.data),
  get: (id: string) => apiClient.get<JobApplication>(`/applications/${id}`).then((r) => r.data),
  create: (
    data:
      | { jobId: string; coverLetter?: string; resumeUrl?: string; answers?: ApplicationAnswer[] }
      | string,
    maybeData?: { coverLetter?: string; resumeUrl?: string; answers?: ApplicationAnswer[] },
  ) => {
    const payload =
      typeof data === 'string' ? { jobId: data, ...(maybeData ?? {}) } : data;
    return apiClient.post<JobApplication>('/applications', payload).then((r) => r.data);
  },
  checkJob: (jobId: string) =>
    apiClient
      .get<{ hasApplied: boolean; applicationId?: string }>(`/applications/check/${jobId}`)
      .then((r) => r.data)
      .catch(() => ({ hasApplied: false })),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<JobApplication>(`/applications/${id}/status`, { status, notes }).then((r) => r.data),
  withdraw: (id: string, reason?: string) =>
    apiClient.post<JobApplication>(`/applications/${id}/withdraw`, { reason }).then((r) => r.data),
  rate: (id: string, rating: number) =>
    apiClient.patch<JobApplication>(`/applications/${id}/rate`, { rating }).then((r) => r.data),
};
