import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../storage';

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  isSidebarOpen: boolean;
  activeBottomTab: string;
  isOffline: boolean;
  isNewJobFilterApplied: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveBottomTab: (tab: string) => void;
  setIsOffline: (offline: boolean) => void;
  setNewJobFilterApplied: (applied: boolean) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      language: 'en',
      isSidebarOpen: false,
      activeBottomTab: 'home',
      isOffline: false,
      isNewJobFilterApplied: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
      setActiveBottomTab: (activeBottomTab) => set({ activeBottomTab }),
      setIsOffline: (isOffline) => set({ isOffline }),
      setNewJobFilterApplied: (isNewJobFilterApplied) => set({ isNewJobFilterApplied }),

      reset: () =>
        set({
          isSidebarOpen: false,
          activeBottomTab: 'home',
          isNewJobFilterApplied: false,
        }),
    }),
    {
      name: 'etvacancy-ui',
      storage: createJSONStorage(() => secureStorage) as any,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    },
  ),
);
