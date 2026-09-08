import { apiClient } from '../client';
import type { PaginatedResponse, SavedJob } from '@/types/index';

export const EMPTY_PAGINATED_SAVED_JOBS: PaginatedResponse<SavedJob> = {
  data: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const savedJobs = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedResponse<SavedJob>>('/saved-jobs', { params })
      .then((r) => r.data ?? EMPTY_PAGINATED_SAVED_JOBS)
      .catch(() => EMPTY_PAGINATED_SAVED_JOBS),
  create: (data: string | { jobId: string; notes?: string }, notes?: string) => {
    const payload = typeof data === 'string' ? { jobId: data, notes } : data;
    return apiClient.post<SavedJob>('/saved-jobs', payload).then((r) => r.data);
  },
  delete: (id: string) => apiClient.delete<void>(`/saved-jobs/${id}`).then((r) => r.data),
  remove: (id: string) => apiClient.delete<void>(`/saved-jobs/${id}`).then((r) => r.data),
  check: (jobId: string) =>
    apiClient
      .get<{ saved: boolean; savedJobId?: string }>(`/saved-jobs/check/${jobId}`)
      .then((r) => ({ isSaved: r.data.saved, savedId: r.data.savedJobId }))
      .catch(() => ({ isSaved: false, savedId: undefined })),
  isSaved: (jobId: string) =>
    apiClient
      .get<{ saved: boolean; savedJobId?: string }>(`/saved-jobs/check/${jobId}`)
      .then((r) => r.data)
      .catch(() => ({ saved: false })),
  toggle: (jobId: string) =>
    apiClient
      .post<SavedJob | { deleted: true }>('/saved-jobs/toggle', { jobId })
      .then((r) => r.data),
};
