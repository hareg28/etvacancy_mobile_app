import { apiClient } from '../client';
import type { Interview, PaginatedResponse } from '@/types/index';

export const interviews = {
  list: (params?: { page?: number; limit?: number; status?: string; jobId?: string }) =>
    apiClient.get<PaginatedResponse<Interview>>('/interviews', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Interview>(`/interviews/${id}`).then((r) => r.data),
  create: (data: Partial<Interview>) =>
    apiClient.post<Interview>('/interviews', data).then((r) => r.data),
  update: (id: string, data: Partial<Interview>) =>
    apiClient.patch<Interview>(`/interviews/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/interviews/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch<Interview>(`/interviews/${id}/status`, { status }).then((r) => r.data),
  addFeedback: (id: string, feedback: string, rating?: number) =>
    apiClient.patch<Interview>(`/interviews/${id}/feedback`, { feedback, rating }).then((r) => r.data),
};
