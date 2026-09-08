import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job } from '@/types/index';
import { secureStorage } from '../storage';
import { DEFAULT_LOCAL_JOBS } from '../mock-data/jobs.data';

export interface LocalJobsState {
  localPostedJobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  clearJobs: () => void;
  getPublishedJobs: () => Job[];
  getFeaturedJobs: (limit?: number) => Job[];
  getRecentJobs: (limit?: number) => Job[];
}

export const useLocalJobsStore = create<LocalJobsState>()(
  persist(
    (set, get) => ({
      localPostedJobs: DEFAULT_LOCAL_JOBS,

      addJob: (job) =>
        set((state) => ({
          localPostedJobs: [job, ...state.localPostedJobs],
        })),

      updateJob: (id, updates) =>
        set((state) => ({
          localPostedJobs: state.localPostedJobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j,
          ),
        })),

      deleteJob: (id) =>
        set((state) => ({
          localPostedJobs: state.localPostedJobs.filter((j) => j.id !== id),
        })),

      clearJobs: () => set({ localPostedJobs: [] }),

      getPublishedJobs: () =>
        get().localPostedJobs.filter((j) => j.status === 'PUBLISHED'),

      getFeaturedJobs: (limit = 10) => {
        const featured = get()
          .localPostedJobs.filter((j) => j.status === 'PUBLISHED' && j.featured)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        return featured.slice(0, limit);
      },

      getRecentJobs: (limit = 10) => {
        const recent = get()
          .localPostedJobs.filter((j) => j.status === 'PUBLISHED')
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        return recent.slice(0, limit);
      },
    }),
    {
      name: 'etvacancy-local-jobs',
      storage: createJSONStorage(() => secureStorage) as any,
    },
  ),
);
