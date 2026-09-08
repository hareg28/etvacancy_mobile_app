import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole, AuthCredentials, RegisterData } from '@/types/index';
import { authClient } from '@lib/auth-client';
import { secureStorage } from '../storage';
import { DEFAULT_REGISTERED_USERS } from '../mock-data/users.data';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOAuthLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  error: string | null;
  oauthError: string | null;
  onboardingComplete: boolean;
  preselectedOAuthRole: Exclude<UserRole, 'PUBLIC' | 'ADMIN'> | null;
  pendingJobId: string | null;
  registeredUsers: User[];
  setToken: (token: string, refreshToken?: string) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOAuthLoading: (loading: boolean) => void;
  setOAuthError: (error: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setPreselectedOAuthRole: (role: Exclude<UserRole, 'PUBLIC' | 'ADMIN'> | null) => void;
  setPendingJobId: (jobId: string | null) => void;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  loginWithGoogle: (authResult: {
    user: User;
    token: string;
    refreshToken?: string;
  }) => boolean;
  registerWithGoogle: (authResult: {
    user: User;
    token: string;
    refreshToken?: string;
    role?: Exclude<UserRole, 'PUBLIC' | 'ADMIN'> | null;
  }) => boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  clearError: () => void;
  clearOAuthError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      isOAuthLoading: false,
      token: null,
      refreshToken: null,
      user: null,
      error: null,
      oauthError: null,
      onboardingComplete: false,
      preselectedOAuthRole: null,
      pendingJobId: null,
      registeredUsers: DEFAULT_REGISTERED_USERS,

      setToken: (token, refreshToken) =>
        set({ token, refreshToken: refreshToken ?? get().refreshToken }),
      setUser: (user) => {
        if (!user) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const currentList = get().registeredUsers ?? [];
        const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
        const updatedList = exists
          ? currentList.map((u) => (u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, ...user } : u))
          : [user, ...currentList];
        set({ user, isAuthenticated: true, registeredUsers: updatedList });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setOAuthLoading: (isOAuthLoading) => set({ isOAuthLoading }),
      setOAuthError: (oauthError) => set({ oauthError }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setPreselectedOAuthRole: (preselectedOAuthRole) => set({ preselectedOAuthRole }),
      setPendingJobId: (pendingJobId) => set({ pendingJobId }),
      clearError: () => set({ error: null }),
      clearOAuthError: () => set({ oauthError: null }),

      loginWithGoogle: (authResult) => {
        try {
          const preselected = get().preselectedOAuthRole;
          const role =
            authResult.user.role && authResult.user.role !== 'PUBLIC'
              ? authResult.user.role
              : preselected ?? 'JOB_SEEKER';
          const user: User = {
            ...authResult.user,
            role,
          };
          const currentList = get().registeredUsers ?? [];
          const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
          const updatedList = exists ? currentList : [user, ...currentList];
          set({
            token: authResult.token,
            refreshToken: authResult.refreshToken ?? get().refreshToken,
            user,
            isAuthenticated: true,
            isOAuthLoading: false,
            oauthError: null,
            preselectedOAuthRole: null,
            registeredUsers: updatedList,
          });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Google login failed';
          set({ oauthError: message, isOAuthLoading: false });
          return false;
        }
      },

      registerWithGoogle: (authResult) => {
        try {
          const preselected = authResult.role ?? get().preselectedOAuthRole;
          const role =
            authResult.user.role && authResult.user.role !== 'PUBLIC'
              ? authResult.user.role
              : preselected ?? 'JOB_SEEKER';
          const user: User = {
            ...authResult.user,
            role,
          };
          const currentList = get().registeredUsers ?? [];
          const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
          const updatedList = exists ? currentList : [user, ...currentList];
          set({
            token: authResult.token,
            refreshToken: authResult.refreshToken ?? get().refreshToken,
            user,
            isAuthenticated: true,
            isOAuthLoading: false,
            oauthError: null,
            preselectedOAuthRole: null,
            registeredUsers: updatedList,
          });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Google sign-up failed';
          set({ oauthError: message, isOAuthLoading: false });
          return false;
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authClient.signIn.email({
            email: credentials.email,
            password: credentials.password,
          }).catch(() => null);

          if (result && !result.error && result.data?.user) {
            const baUser = result.data.user;
            const user: User = {
              id: baUser.id,
              email: baUser.email,
              firstName: (baUser as any).firstName ?? baUser.name?.split(' ')[0] ?? '',
              lastName: (baUser as any).lastName ?? baUser.name?.split(' ').slice(1).join(' ') ?? '',
              fullName: baUser.name ?? baUser.email,
              avatar: baUser.image ?? null,
              role: ((baUser as any).role as UserRole) ?? 'JOB_SEEKER',
              isActive: true,
              emailVerified: baUser.emailVerified ?? false,
              verificationStatus: baUser.emailVerified ? 'VERIFIED' : 'UNVERIFIED',
              createdAt: (baUser as any).createdAt ?? new Date().toISOString(),
              updatedAt: (baUser as any).updatedAt ?? new Date().toISOString(),
            };
            const currentList = get().registeredUsers ?? [];
            const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
            const updatedList = exists
              ? currentList.map((u) => (u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, ...user } : u))
              : [user, ...currentList];
            set({
              token: (result.data as any)?.token ?? `token_${Date.now()}`,
              refreshToken: (result.data as any)?.refreshToken ?? null,
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              registeredUsers: updatedList,
            });
            return true;
          }
        } catch {
          // ignore API error and proceed with local/demo fallback
        }

        // Local / Offline fallback auth
        const emailLower = credentials.email.toLowerCase();
        const currentList = get().registeredUsers ?? [];
        let existingUser = currentList.find((u) => u.email.toLowerCase() === emailLower);

        if (!existingUser) {
          const role: UserRole =
            emailLower.includes('admin') ? 'ADMIN' :
            emailLower.includes('employer') ? 'EMPLOYER' : 'JOB_SEEKER';
          const nameParts = emailLower.split('@')[0].split(/[._-]/);
          const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
          const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';

          existingUser = {
            id: `usr_${Date.now()}`,
            email: credentials.email,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            avatar: null,
            role,
            isActive: true,
            emailVerified: true,
            verificationStatus: 'VERIFIED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        const updatedList = currentList.some((u) => u.email.toLowerCase() === emailLower)
          ? currentList
          : [existingUser, ...currentList];

        set({
          token: `demo_token_${Date.now()}`,
          refreshToken: `demo_refresh_${Date.now()}`,
          user: existingUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          registeredUsers: updatedList,
        });
        return true;
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authClient.signUp.email({
            email: data.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`.trim(),
          }).catch(() => null);

          if (result && !result.error && result.data?.user) {
            const baUser = result.data.user;
            const user: User = {
              id: baUser.id,
              email: baUser.email,
              firstName: data.firstName,
              lastName: data.lastName,
              fullName: `${data.firstName} ${data.lastName}`.trim(),
              avatar: baUser.image ?? null,
              role: data.role,
              isActive: true,
              emailVerified: baUser.emailVerified ?? false,
              verificationStatus: baUser.emailVerified ? 'VERIFIED' : 'UNVERIFIED',
              createdAt: (baUser as any).createdAt ?? new Date().toISOString(),
              updatedAt: (baUser as any).updatedAt ?? new Date().toISOString(),
            };
            const currentList = get().registeredUsers ?? [];
            const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
            const updatedList = exists ? currentList : [user, ...currentList];
            set({
              token: (result.data as any)?.token ?? `token_${Date.now()}`,
              refreshToken: (result.data as any)?.refreshToken ?? null,
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              registeredUsers: updatedList,
            });
            return true;
          }
        } catch {
          // ignore API error and proceed with local fallback
        }

        const user: User = {
          id: `usr_${Date.now()}`,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          avatar: null,
          role: data.role,
          isActive: true,
          emailVerified: true,
          verificationStatus: 'VERIFIED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const currentList = get().registeredUsers ?? [];
        const exists = currentList.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
        const updatedList = exists ? currentList : [user, ...currentList];

        set({
          token: `demo_token_${Date.now()}`,
          refreshToken: `demo_refresh_${Date.now()}`,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          registeredUsers: updatedList,
        });
        return true;
      },

      logout: async () => {
        try {
          await authClient.signOut();
        } catch {
          // ignore – local state is cleared regardless
        }
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
          oauthError: null,
          isOAuthLoading: false,
        });
      },

      refreshSession: async () => {
        try {
          const result = await authClient.getSession();
          if (!result?.data?.user) {
            set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
            return false;
          }
          const baUser = result.data.user;
          const user: User = {
            id: baUser.id,
            email: baUser.email,
            firstName: (baUser as any).firstName ?? baUser.name?.split(' ')[0] ?? '',
            lastName: (baUser as any).lastName ?? baUser.name?.split(' ').slice(1).join(' ') ?? '',
            fullName: baUser.name ?? baUser.email,
            avatar: baUser.image ?? null,
            role: ((baUser as any).role as UserRole) ?? 'JOB_SEEKER',
            isActive: true,
            emailVerified: baUser.emailVerified ?? false,
            verificationStatus: baUser.emailVerified ? 'VERIFIED' : 'UNVERIFIED',
            createdAt: (baUser as any).createdAt ?? new Date().toISOString(),
            updatedAt: (baUser as any).updatedAt ?? new Date().toISOString(),
          };
          set({
            token: (result.data as any)?.token ?? get().token,
            user,
            isAuthenticated: true,
          });
          return true;
        } catch {
          set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
          return false;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authClient.forgetPassword({ email, redirectTo: '/reset-password' });
          if (result.error) {
            set({ error: result.error.message ?? 'Request failed', isLoading: false });
            return false;
          }
          set({ isLoading: false });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Forgot password request failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authClient.resetPassword({ token, newPassword: password });
          if (result.error) {
            set({ error: result.error.message ?? 'Reset failed', isLoading: false });
            return false;
          }
          set({ isLoading: false });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Reset password failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'etvacancy-auth',
      storage: createJSONStorage(() => secureStorage) as any,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isOAuthLoading = false;
        }
      },
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
      }),
    },
  ),
);

// Selectors
export const selectUserRole = (state: AuthState): UserRole =>
  state.user?.role ?? 'PUBLIC';

export const selectIsJobSeeker = (state: AuthState): boolean =>
  state.user?.role === 'JOB_SEEKER';

export const selectIsEmployer = (state: AuthState): boolean =>
  state.user?.role === 'EMPLOYER';

export const selectIsAdmin = (state: AuthState): boolean =>
  state.user?.role === 'ADMIN';

export const selectIsAuthenticated = (state: AuthState): boolean =>
  state.isAuthenticated;
