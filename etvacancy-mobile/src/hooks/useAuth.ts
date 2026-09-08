import { useAuthStore } from '../store/slices/auth.slice';

/**
 * Convenient auth hook providing quick access to auth state, user, and helper flags
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isOAuthLoading = useAuthStore((s) => s.isOAuthLoading);
  const error = useAuthStore((s) => s.error);
  const oauthError = useAuthStore((s) => s.oauthError);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  const role = user?.role ?? 'PUBLIC';
  const isJobSeeker = role === 'JOB_SEEKER';
  const isEmployer = role === 'EMPLOYER';
  const isAdmin = role === 'ADMIN';

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    isOAuthLoading,
    error,
    oauthError,
    isJobSeeker,
    isEmployer,
    isAdmin,
    login,
    register,
    logout,
    clearError,
  };
}
