import axios from 'axios';
import type { ApiError } from '@/types/index';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data;
    if (data?.message) {
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.message)) return (data.message as unknown as string[]).join(', ');
    }
    if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (error.response?.status === 401) return 'Unauthorized. Please log in again.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'Resource not found.';
    if (error.response?.status === 422) return 'Validation error. Please check your input.';
    if (error.response?.status && error.response.status >= 500)
      return 'Server error. Please try again later.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
};
