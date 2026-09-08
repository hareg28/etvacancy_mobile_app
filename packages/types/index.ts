export type UserRole = 'PUBLIC' | 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';

export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type InterviewStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type InterviewType = 'PHONE' | 'VIDEO' | 'IN_PERSON' | 'ASSESSMENT';

export type JobType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'TEMPORARY'
  | 'INTERNSHIP'
  | 'FREELANCE';

export type ExperienceLevel =
  | 'ENTRY'
  | 'JUNIOR'
  | 'MID'
  | 'SENIOR'
  | 'LEAD'
  | 'EXECUTIVE';

export type SalaryPeriod = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type EmploymentType = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type CompanySize =
  | 'SELF_EMPLOYED'
  | '1_10'
  | '11_50'
  | '51_200'
  | '201_500'
  | '501_1000'
  | '1001_5000'
  | '5001_10000'
  | '10001_PLUS';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type EducationLevel =
  | 'HIGH_SCHOOL'
  | 'DIPLOMA'
  | 'ASSOCIATE'
  | 'BACHELOR'
  | 'MASTER'
  | 'DOCTORATE'
  | 'CERTIFICATION';

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  jobSeekerProfile?: JobSeekerProfile | null;
  employerProfile?: EmployerProfile | null;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  headline?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  currentCity?: string | null;
  currentCountry?: string | null;
  currentSalary?: string | number | null;
  expectedSalary?: string | number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  noticePeriod?: number | null;
  isOpenToWork: boolean;
  isRelocating: boolean;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  desiredJobTitles?: string[] | null;
  preferredLocations?: string[] | null;
  skills?: Skill[] | null;
  experiences?: WorkExperience[] | null;
  education?: Education[] | null;
  certifications?: Certification[] | null;
  languages?: LanguageSkill[] | null;
}

export interface WorkExperience {
  id: string;
  profileId: string;
  title: string;
  company: string;
  location?: string | null;
  employmentType?: EmploymentType | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  accomplishments?: string[] | null;
  skillsUsed?: string[] | null;
}

export interface Education {
  id: string;
  profileId: string;
  institution: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  level: EducationLevel;
  startDate: string;
  endDate?: string | null;
  isCompleted: boolean;
  grade?: string | null;
  description?: string | null;
  activities?: string | null;
}

export interface Certification {
  id: string;
  profileId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  doesNotExpire: boolean;
}

export interface LanguageSkill {
  id: string;
  profileId: string;
  language: string;
  proficiency: 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'UPPER_INTERMEDIATE' | 'ADVANCED' | 'NATIVE';
  isSpoken: boolean;
  isWritten: boolean;
}

export interface Skill {
  id: string;
  profileId?: string | null;
  jobId?: string | null;
  name: string;
  category?: string | null;
  level?: 1 | 2 | 3 | 4 | 5 | null;
  isRequired?: boolean | null;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  position?: string | null;
  department?: string | null;
  isPrimaryContact: boolean;
  companyId?: string | null;
  company?: Company | null;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  tagline?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  size: CompanySize;
  foundedYear?: number | null;
  headquarters?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  logo?: string | null;
  bannerImage?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  phone?: string | null;
  supportEmail?: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  benefits?: CompanyBenefit[] | null;
  photos?: CompanyPhoto[] | null;
  vacancies?: Job[] | null;
  vacanciesCount?: number | null;
  jobsCount?: number | null;
}

export interface CompanyBenefit {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  category?: string | null;
}

export interface CompanyPhoto {
  id: string;
  companyId: string;
  url: string;
  caption?: string | null;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  jobsCount?: number | null;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  howToApply?: string | null;
  type: JobType;
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  minYearsExperience?: number | null;
  maxYearsExperience?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  isSalaryVisible: boolean;
  city?: string | null;
  region?: string | null;
  country: string;
  postalCode?: string | null;
  remotePolicy?: string | null;
  relocationOffered: boolean;
  visaSponsorship: boolean;
  travelRequired: boolean;
  travelPercentage?: number | null;
  urgentHiring: boolean;
  vacancyCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EXPIRED' | 'ARCHIVED';
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  applicationsCount?: number | null;
  companyId: string;
  company?: Company | null;
  categoryId?: string | null;
  category?: Category | null;
  postedById: string;
  postedBy?: User | null;
  skills?: Skill[] | null;
  questions?: JobQuestion[] | null;
  isSaved?: boolean | null;
  hasApplied?: boolean | null;
}

export interface JobQuestion {
  id: string;
  jobId: string;
  text: string;
  type: 'TEXT' | 'PARAGRAPH' | 'YES_NO' | 'MULTIPLE_CHOICE' | 'DROPDOWN' | 'DATE' | 'NUMBER' | 'FILE';
  isRequired: boolean;
  sortOrder: number;
  options?: string[] | null;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job | null;
  applicantId: string;
  applicant?: User | null;
  profileSnapshot?: JobSeekerProfile | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  answers?: ApplicationAnswer[] | null;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt?: string | null;
  shortlistedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
  hiringNotes?: string | null;
  rating?: number | null;
  source?: string | null;
  referralCode?: string | null;
  interviews?: Interview[] | null;
}

export interface ApplicationAnswer {
  questionId: string;
  questionText: string;
  answer: string | string[] | boolean | number | null;
}

export interface Interview {
  id: string;
  applicationId: string;
  application?: JobApplication | null;
  jobId: string;
  job?: Job | null;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  location?: string | null;
  meetingUrl?: string | null;
  interviewerIds: string[];
  notes?: string | null;
  feedback?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  jobId: string;
  job?: Job | null;
  userId: string;
  savedAt: string;
  notes?: string | null;
}

export interface Permission {
  id: string;
  action: string;
  subject: string;
  conditions?: Record<string, unknown> | null;
  fields?: string[] | null;
  inverted?: boolean;
  reason?: string | null;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permissionId: string;
  permission?: Permission;
}

export interface AnalyticsData {
  totalUsers: number;
  totalEmployers: number;
  totalJobSeekers: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalCompanies: number;
  verifiedCompanies: number;
  jobsByCategory: Array<{ category: string; count: number }>;
  applicationsByStatus: Array<{ status: ApplicationStatus; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  jobGrowth: Array<{ date: string; count: number }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  jobId?: string;
  role?: string;
  query?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  message: string | string[];
  code?: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  firstName: string;
  lastName: string;
  role: Exclude<UserRole, 'PUBLIC'>;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface PasswordResetData {
  email: string;
  token?: string;
  password?: string;
  confirmPassword?: string;
}

export interface JobFilterParams extends PaginationParams {
  query?: string;
  categoryId?: string;
  location?: string;
  country?: string;
  city?: string;
  type?: JobType;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  remoteOnly?: boolean;
  urgentOnly?: boolean;
  companyId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}
