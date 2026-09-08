import { apiClient } from '../client';
import type { Category } from '@/types/index';
import { REAL_CATEGORIES } from './categories.data';

export const categories = {
  list: (params?: { active?: boolean; withCounts?: boolean }) =>
    apiClient
      .get<Category[]>('/categories', { params })
      .then((r) => (r.data && r.data.length > 0 ? r.data : REAL_CATEGORIES))
      .catch(() => REAL_CATEGORIES),
  get: (id: string) =>
    apiClient
      .get<Category>(`/categories/${id}`)
      .then((r) => r.data)
      .catch(() => REAL_CATEGORIES.find((c) => c.id === id) || REAL_CATEGORIES[0]),
  create: (data: Partial<Category>) => apiClient.post<Category>('/categories', data).then((r) => r.data),
  update: (id: string, data: Partial<Category>) =>
    apiClient.patch<Category>(`/categories/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/categories/${id}`).then((r) => r.data),
  reorder: (orders: { id: string; sortOrder: number }[]) =>
    apiClient.post<void>('/categories/reorder', { orders }).then((r) => r.data),
};
