/**
 * State Management Barrel
 * Decomposed into modular domain slices with full backward-compatibility.
 */

// Storage
export { webStorage, secureStorage } from './storage';

// Mock Seed Data
export { DEFAULT_REGISTERED_USERS } from './mock-data/users.data';
export { DEFAULT_LOCAL_JOBS } from './mock-data/jobs.data';

// Slices & Stores
export {
  useAuthStore,
  selectUserRole,
  selectIsJobSeeker,
  selectIsEmployer,
  selectIsAdmin,
  selectIsAuthenticated,
  type AuthState,
} from './slices/auth.slice';

export { useUIStore, type UIState } from './slices/ui.slice';

export { useJobFilterStore, type JobFilterState } from './slices/job-filter.slice';

export { useLocalJobsStore, type LocalJobsState } from './slices/local-jobs.slice';

export { useSavedJobsStore, type SavedJobsState } from './slices/saved-jobs.slice';

// Hooks
export { usePermission } from './hooks/usePermission';
