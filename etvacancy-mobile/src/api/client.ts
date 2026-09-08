import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@constants/index';
import type { ApiError } from '@/types/index';
import { authClient } from '@lib/auth-client';
import { useAuthStore } from '../store/slices/auth.slice';

export const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 1. Try the Zustand store first (fastest, no async)
      let token: string | null | undefined = useAuthStore.getState().token;

      // 2. Fall back to the Better Auth session if the store hasn't hydrated
      if (!token) {
        try {
          const session = await authClient.getSession();
          token = (session?.data as any)?.token ?? null;
        } catch {
          // no active session – proceed without token
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !(originalRequest as { _retry?: boolean })._retry
      ) {
        (originalRequest as { _retry?: boolean })._retry = true;
        const refreshed = await useAuthStore.getState().refreshSession();
        if (refreshed) {
          const token = useAuthStore.getState().token;
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return client(originalRequest);
        }
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient(API_BASE_URL);
