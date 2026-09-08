import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { savedJobs as savedJobsApi } from '@api/index';
import { useAuthStore, useSavedJobsStore } from '@store/index';
import type { Job, SavedJob } from '@/types/index';

/**
 * Hook to manage saved/bookmarked jobs across the entire app
 * Seamlessly handles API queries, local store fallback, and optimistic updates.
 */
export function useSavedJobs() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isSeeker = user?.role === 'JOB_SEEKER' || !user?.role || user?.role === 'PUBLIC';

  const localSavedJobs = useSavedJobsStore((s) => s.savedJobs);
  const toggleLocalSaved = useSavedJobsStore((s) => s.toggleSavedJob);
  const saveLocalJob = useSavedJobsStore((s) => s.saveJob);
  const removeLocalSaved = useSavedJobsStore((s) => s.removeSavedJob);

  // Fetch remote saved jobs when authenticated
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => savedJobsApi.list({ limit: 100 }),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Combined saved jobs list (Remote + Local)
  const savedJobs = useMemo<SavedJob[]>(() => {
    const apiList = Array.isArray(apiData?.data) ? apiData.data : [];
    if (!isAuthenticated) return localSavedJobs;

    const apiJobIds = new Set(apiList.map((item) => item.jobId || item.job?.id).filter(Boolean));
    const extraLocal = localSavedJobs.filter((item) => !apiJobIds.has(item.jobId) && !apiJobIds.has(item.job?.id));

    return [...apiList, ...extraLocal];
  }, [apiData, localSavedJobs, isAuthenticated]);

  // Set of all saved job IDs for O(1) lookup
  const savedJobIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const item of savedJobs) {
      if (item.jobId) set.add(item.jobId);
      if (item.job?.id) set.add(item.job.id);
      if (item.id) set.add(item.id);
    }
    return set;
  }, [savedJobs]);

  const isSaved = useCallback(
    (jobId: string): boolean => {
      if (!jobId) return false;
      return savedJobIds.has(jobId);
    },
    [savedJobIds],
  );

  const toggleSaveMutation = useMutation({
    mutationFn: async (job: Job) => {
      const currentlySaved = isSaved(job.id);
      if (currentlySaved) {
        // Find saved item ID if exists
        const match = savedJobs.find((s) => s.jobId === job.id || s.job?.id === job.id);
        const deleteId = match?.id ?? job.id;
        try {
          await savedJobsApi.remove(deleteId);
        } catch {
          // fallback to toggle
          await savedJobsApi.toggle(job.id);
        }
      } else {
        await savedJobsApi.create({ jobId: job.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });

  const toggleSave = useCallback(
    async (job: Job): Promise<boolean> => {
      if (!job || !job.id) return false;

      // 1. Optimistically update local Zustand store
      const isNowSaved = toggleLocalSaved(job);

      // 2. If authenticated, trigger API call in background
      if (isAuthenticated) {
        try {
          await toggleSaveMutation.mutateAsync(job);
        } catch (err) {
          console.warn('Failed to sync save state to backend:', err);
        }
      }

      return isNowSaved;
    },
    [isAuthenticated, toggleLocalSaved, toggleSaveMutation],
  );

  return {
    savedJobs,
    savedJobIds,
    savedCount: savedJobs.length,
    isSaved,
    toggleSave,
    isLoading: isAuthenticated ? isLoading : false,
    saveLocalJob,
    removeLocalSaved,
  };
}
