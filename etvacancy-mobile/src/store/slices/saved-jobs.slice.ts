import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, SavedJob } from '@/types/index';
import { secureStorage } from '../storage';

export interface SavedJobsState {
  savedJobs: SavedJob[];
  isSaved: (jobId: string) => boolean;
  saveJob: (job: Job, notes?: string) => SavedJob;
  removeSavedJob: (jobId: string) => void;
  toggleSavedJob: (job: Job, notes?: string) => boolean; // returns true if now saved, false if unsaved
  setSavedJobs: (jobs: SavedJob[]) => void;
  clearSavedJobs: () => void;
}

export const useSavedJobsStore = create<SavedJobsState>()(
  persist(
    (set, get) => ({
      savedJobs: [],

      isSaved: (jobId: string) => {
        return get().savedJobs.some((item) => item.jobId === jobId || item.job?.id === jobId);
      },

      saveJob: (job: Job, notes?: string) => {
        const existing = get().savedJobs.find((item) => item.jobId === job.id || item.job?.id === job.id);
        if (existing) return existing;

        const newSavedJob: SavedJob = {
          id: `saved_${job.id}_${Date.now()}`,
          jobId: job.id,
          job,
          userId: 'current-user',
          savedAt: new Date().toISOString(),
          notes: notes ?? null,
        };

        set((state) => ({
          savedJobs: [newSavedJob, ...state.savedJobs],
        }));

        return newSavedJob;
      },

      removeSavedJob: (jobId: string) => {
        set((state) => ({
          savedJobs: state.savedJobs.filter((item) => item.jobId !== jobId && item.job?.id !== jobId && item.id !== jobId),
        }));
      },

      toggleSavedJob: (job: Job, notes?: string) => {
        const currentlySaved = get().isSaved(job.id);
        if (currentlySaved) {
          get().removeSavedJob(job.id);
          return false;
        } else {
          get().saveJob(job, notes);
          return true;
        }
      },

      setSavedJobs: (jobs: SavedJob[]) => {
        set({ savedJobs: jobs });
      },

      clearSavedJobs: () => {
        set({ savedJobs: [] });
      },
    }),
    {
      name: 'etvacancy-saved-jobs',
      storage: createJSONStorage(() => secureStorage) as any,
    },
  ),
);
