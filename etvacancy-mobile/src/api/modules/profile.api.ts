import { apiClient } from '../client';
import type {
  Certification,
  Education,
  EmployerProfile,
  JobSeekerProfile,
  Skill,
  User,
  WorkExperience,
} from '@/types/index';

export const profile = {
  getJobSeeker: () =>
    apiClient.get<JobSeekerProfile>('/profile/job-seeker').then((r) => r.data),
  updateJobSeeker: (data: Partial<JobSeekerProfile>) =>
    apiClient.patch<JobSeekerProfile>('/profile/job-seeker', data).then((r) => r.data),
  getEmployer: () =>
    apiClient.get<EmployerProfile>('/profile/employer').then((r) => r.data),
  updateEmployer: (data: Partial<EmployerProfile>) =>
    apiClient.patch<EmployerProfile>('/profile/employer', data).then((r) => r.data),
  uploadAvatar: (file: FormData) =>
    apiClient.post<User>('/profile/avatar', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  uploadResume: (file: FormData) =>
    apiClient.post<{ resumeUrl: string; resumeFileName: string }>('/profile/resume', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
};

export const experiences = {
  list: () => apiClient.get<WorkExperience[]>('/profile/experiences').then((r) => r.data),
  create: (data: Partial<WorkExperience>) =>
    apiClient.post<WorkExperience>('/profile/experiences', data).then((r) => r.data),
  update: (id: string, data: Partial<WorkExperience>) =>
    apiClient.patch<WorkExperience>(`/profile/experiences/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<void>(`/profile/experiences/${id}`).then((r) => r.data),
};

export const education = {
  list: () => apiClient.get<Education[]>('/profile/education').then((r) => r.data),
  create: (data: Partial<Education>) =>
    apiClient.post<Education>('/profile/education', data).then((r) => r.data),
  update: (id: string, data: Partial<Education>) =>
    apiClient.patch<Education>(`/profile/education/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/profile/education/${id}`).then((r) => r.data),
};

export const certifications = {
  list: () => apiClient.get<Certification[]>('/profile/certifications').then((r) => r.data),
  create: (data: Partial<Certification>) =>
    apiClient.post<Certification>('/profile/certifications', data).then((r) => r.data),
  update: (id: string, data: Partial<Certification>) =>
    apiClient.patch<Certification>(`/profile/certifications/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<void>(`/profile/certifications/${id}`).then((r) => r.data),
};

export const skills = {
  list: () => apiClient.get<Skill[]>('/profile/skills').then((r) => r.data),
  create: (data: Partial<Skill>) =>
    apiClient.post<Skill>('/profile/skills', data).then((r) => r.data),
  delete: (id: string) => apiClient.delete<void>(`/profile/skills/${id}`).then((r) => r.data),
  suggest: (query: string) =>
    apiClient.get<Skill[]>('/profile/skills/suggest', { params: { query } }).then((r) => r.data),
};
