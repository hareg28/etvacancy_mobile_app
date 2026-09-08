import { apiClient } from '../client';
import type { Job, JobFilterParams, PaginatedResponse } from '@/types/index';

export const EMPTY_PAGINATED_JOBS: PaginatedResponse<Job> = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const jobs = {
  list: (params?: JobFilterParams) =>
    apiClient
      .get<PaginatedResponse<Job>>('/jobs', { params })
      .then((r) => r.data ?? EMPTY_PAGINATED_JOBS)
      .catch(() => EMPTY_PAGINATED_JOBS),
  get: (id: string) => apiClient.get<Job>(`/jobs/${id}`).then((r) => r.data),
  getBySlug: (slug: string) => apiClient.get<Job>(`/jobs/slug/${slug}`).then((r) => r.data),
  create: (data: Partial<Job>) => apiClient.post<Job>('/jobs', data).then((r) => r.data),
  update: (id: string, data: Partial<Job>) =>
    apiClient.patch<Job>(`/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/jobs/${id}`).then((r) => r.data),
  publish: (id: string) => apiClient.post<Job>(`/jobs/${id}/publish`).then((r) => r.data),
  archive: (id: string) => apiClient.post<Job>(`/jobs/${id}/archive`).then((r) => r.data),
  close: (id: string) => apiClient.post<Job>(`/jobs/${id}/close`).then((r) => r.data),
  similar: (id: string, limit = 5) =>
    apiClient
      .get<Job[]>(`/jobs/${id}/similar`, { params: { limit } })
      .then((r) => r.data ?? [])
      .catch(() => []),
  featured: (limit = 10) =>
    apiClient
      .get<Job[]>('/jobs/featured', { params: { limit } })
      .then((r) => r.data ?? [])
      .catch(() => []),
  recent: (limit = 10) =>
    apiClient
      .get<Job[]>('/jobs/recent', { params: { limit } })
      .then((r) => r.data ?? [])
      .catch(() => []),
  stats: () =>
    apiClient
      .get<Record<string, number>>('/jobs/stats')
      .then((r) => r.data)
      .catch(() => ({ activeJobs: 0, total: 0, totalCompanies: 0 })),
};
