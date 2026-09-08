import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../storage';

export interface JobFilterState {
  query: string;
  categoryId: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  type: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  remoteOnly: boolean;
  urgentOnly: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  setQuery: (q: string) => void;
  setCategoryId: (id: string | null) => void;
  setLocation: (loc: string | null) => void;
  setCountry: (c: string | null) => void;
  setCity: (c: string | null) => void;
  setType: (t: string | null) => void;
  setEmploymentType: (t: string | null) => void;
  setExperienceLevel: (l: string | null) => void;
  setSalaryMin: (min: number | null) => void;
  setSalaryMax: (max: number | null) => void;
  setRemoteOnly: (r: boolean) => void;
  setUrgentOnly: (u: boolean) => void;
  setSortBy: (s: string) => void;
  setSortOrder: (o: 'asc' | 'desc') => void;
  setPage: (p: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  clearFilters: () => void;
}

const defaultPagination = { page: 1, limit: 20 };
const defaultSort = { sortBy: 'createdAt', sortOrder: 'desc' as const };

export const useJobFilterStore = create<JobFilterState>()(
  persist(
    (set) => ({
      query: '',
      categoryId: null,
      location: null,
      country: 'Ethiopia',
      city: null,
      type: null,
      employmentType: null,
      experienceLevel: null,
      salaryMin: null,
      salaryMax: null,
      remoteOnly: false,
      urgentOnly: false,
      ...defaultSort,
      ...defaultPagination,

      setQuery: (query) => set({ query, page: 1 }),
      setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
      setLocation: (location) => set({ location, page: 1 }),
      setCountry: (country) => set({ country, page: 1 }),
      setCity: (city) => set({ city, page: 1 }),
      setType: (type) => set({ type, page: 1 }),
      setEmploymentType: (employmentType) => set({ employmentType, page: 1 }),
      setExperienceLevel: (experienceLevel) => set({ experienceLevel, page: 1 }),
      setSalaryMin: (salaryMin) => set({ salaryMin, page: 1 }),
      setSalaryMax: (salaryMax) => set({ salaryMax, page: 1 }),
      setRemoteOnly: (remoteOnly) => set({ remoteOnly, page: 1 }),
      setUrgentOnly: (urgentOnly) => set({ urgentOnly, page: 1 }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setPage: (page) => set({ page }),
      nextPage: () => set((state) => ({ page: state.page + 1 })),
      prevPage: () => set((state) => ({ page: Math.max(1, state.page - 1) })),
      reset: () =>
        set({
          ...defaultPagination,
          ...defaultSort,
        }),
      clearFilters: () =>
        set({
          query: '',
          categoryId: null,
          location: null,
          country: 'Ethiopia',
          city: null,
          type: null,
          employmentType: null,
          experienceLevel: null,
          salaryMin: null,
          salaryMax: null,
          remoteOnly: false,
          urgentOnly: false,
          ...defaultPagination,
          ...defaultSort,
        }),
    }),
    {
      name: 'etvacancy-job-filter',
      storage: createJSONStorage(() => secureStorage) as any,
      partialize: (state) => ({
        query: state.query,
        categoryId: state.categoryId,
        location: state.location,
        country: state.country,
        city: state.city,
        type: state.type,
        employmentType: state.employmentType,
        experienceLevel: state.experienceLevel,
        salaryMin: state.salaryMin,
        salaryMax: state.salaryMax,
        remoteOnly: state.remoteOnly,
        urgentOnly: state.urgentOnly,
      }),
    },
  ),
);
