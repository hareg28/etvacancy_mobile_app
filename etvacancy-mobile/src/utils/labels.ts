import type {
  ApplicationStatus,
  InterviewStatus,
  JobType,
  ExperienceLevel,
  EmploymentType,
  CompanySize,
  EducationLevel,
  UserRole,
} from '@/types/index';

export const jobTypeLabels: Record<JobType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry Level',
  JUNIOR: 'Junior',
  MID: 'Mid Level',
  SENIOR: 'Senior',
  LEAD: 'Lead / Principal',
  EXECUTIVE: 'Executive',
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

export const applicationStatusLabels: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'warning' },
  REVIEWED: { label: 'Reviewed', color: 'info' },
  SHORTLISTED: { label: 'Shortlisted', color: 'primary' },
  INTERVIEW: { label: 'Interview', color: 'primary' },
  OFFERED: { label: 'Offered', color: 'success' },
  HIRED: { label: 'Hired', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', color: 'neutral' },
};

export const interviewStatusLabels: Record<InterviewStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'primary' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'neutral' },
  NO_SHOW: { label: 'No Show', color: 'danger' },
};

export const companySizeLabels: Record<CompanySize, string> = {
  SELF_EMPLOYED: 'Self-employed',
  '1_10': '1-10 employees',
  '11_50': '11-50 employees',
  '51_200': '51-200 employees',
  '201_500': '201-500 employees',
  '501_1000': '501-1,000 employees',
  '1001_5000': '1,001-5,000 employees',
  '5001_10000': '5,001-10,000 employees',
  '10001_PLUS': '10,001+ employees',
};

export const educationLevelLabels: Record<EducationLevel, string> = {
  HIGH_SCHOOL: 'High School / Secondary',
  DIPLOMA: 'Diploma / Associate',
  ASSOCIATE: 'Associate Degree',
  BACHELOR: "Bachelor's Degree",
  MASTER: "Master's Degree",
  DOCTORATE: 'PhD / Doctorate',
  CERTIFICATION: 'Professional Certification',
};

export const roleLabels: Record<UserRole, string> = {
  PUBLIC: 'Public',
  JOB_SEEKER: 'Job Seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Administrator',
};

export function getStatusColor(status: string, type: 'application' | 'interview' | 'default' = 'default'): string {
  if (type === 'application') {
    const map: Record<string, string> = {
      PENDING: '#F59E0B',
      REVIEWED: '#3B82F6',
      SHORTLISTED: '#1D4ED8',
      INTERVIEW: '#1D4ED8',
      OFFERED: '#10B981',
      HIRED: '#10B981',
      REJECTED: '#EF4444',
      WITHDRAWN: '#6B7280',
    };
    return map[status] || '#6B7280';
  }
  if (type === 'interview') {
    const map: Record<string, string> = {
      SCHEDULED: '#1D4ED8',
      IN_PROGRESS: '#F59E0B',
      COMPLETED: '#10B981',
      CANCELLED: '#6B7280',
      NO_SHOW: '#EF4444',
    };
    return map[status] || '#6B7280';
  }
  return '#6B7280';
}
