import { z } from 'zod';
import { DEFAULT_COUNTRY } from '@constants/index';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name is too long').trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name is too long').trim(),
    email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['JOB_SEEKER', 'EMPLOYER'], {
      required_error: 'Please select your account type',
    }),
    phone: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, 'You must accept the terms of service'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim(),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  headline: z.string().max(120, 'Headline is too long').optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio is too long').optional().or(z.literal('')),
  currentCity: z.string().max(50).optional().or(z.literal('')),
  currentCountry: z.string().max(50).default(DEFAULT_COUNTRY),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().max(3).default('ETB'),
  noticePeriod: z.number().int().min(0).max(365).optional().nullable(),
  isOpenToWork: z.boolean(),
  isRelocating: z.boolean(),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const experienceSchema = z.object({
  title: z.string().min(2, 'Job title is required').max(100),
  company: z.string().min(2, 'Company name is required').max(100),
  location: z.string().max(100).optional().or(z.literal('')),
  employmentType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
  accomplishments: z.array(z.string()).optional(),
  skillsUsed: z.array(z.string()).optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  institution: z.string().min(2, 'Institution name is required').max(200),
  degree: z.string().max(100).optional().or(z.literal('')),
  fieldOfStudy: z.string().max(100).optional().or(z.literal('')),
  level: z.enum(['HIGH_SCHOOL', 'DIPLOMA', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATION'], {
    required_error: 'Please select education level',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isCompleted: z.boolean().default(false),
  grade: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  activities: z.string().max(500).optional().or(z.literal('')),
});

export type EducationFormValues = z.infer<typeof educationSchema>;

export const certificationSchema = z.object({
  name: z.string().min(2, 'Certification name is required').max(200),
  issuingOrganization: z.string().min(2, 'Issuing organization is required').max(200),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional().nullable(),
  credentialId: z.string().max(100).optional().or(z.literal('')),
  credentialUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  doesNotExpire: z.boolean().default(false),
});

export type CertificationFormValues = z.infer<typeof certificationSchema>;

export const jobSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters').max(200).trim(),
  description: z.string().min(100, 'Job description must be at least 100 characters'),
  responsibilities: z.string().optional().or(z.literal('')),
  requirements: z.string().optional().or(z.literal('')),
  benefits: z.string().optional().or(z.literal('')),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'], {
    required_error: 'Please select job type',
  }),
  experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'], {
    required_error: 'Please select experience level',
  }),
  employmentType: z.enum(['REMOTE', 'HYBRID', 'ONSITE'], {
    required_error: 'Please select work location type',
  }),
  minYearsExperience: z.number().int().min(0).max(50).optional().nullable(),
  maxYearsExperience: z.number().int().min(0).max(50).optional().nullable(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().max(3).default('ETB'),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  isSalaryVisible: z.boolean().default(true),
  city: z.string().max(100).optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  country: z.string().min(2, 'Country is required').max(50).default(DEFAULT_COUNTRY),
  remotePolicy: z.string().max(500).optional().or(z.literal('')),
  relocationOffered: z.boolean().default(false),
  visaSponsorship: z.boolean().default(false),
  travelRequired: z.boolean().default(false),
  travelPercentage: z.number().int().min(0).max(100).optional().nullable(),
  urgentHiring: z.boolean().default(false),
  vacancyCount: z.number().int().min(1).max(1000).default(1),
  categoryId: z.string().max(100).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export type JobFormValues = z.infer<typeof jobSchema>;

export const applicationSchema = z.object({
  coverLetter: z.string().max(5000, 'Cover letter is too long').optional().or(z.literal('')),
  resumeUrl: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      questionText: z.string(),
      answer: z.union([z.string(), z.array(z.string()), z.boolean(), z.number(), z.null()]),
    }),
  ).optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;

export const interviewSchema = z.object({
  title: z.string().min(2, 'Interview title is required').max(200),
  type: z.enum(['PHONE', 'VIDEO', 'IN_PERSON', 'ASSESSMENT'], {
    required_error: 'Please select interview type',
  }),
  scheduledAt: z.string().min(1, 'Scheduled date and time is required'),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration must be less than 8 hours').default(60),
  timezone: z.string().default('Africa/Addis_Ababa'),
  location: z.string().max(200).optional().or(z.literal('')),
  meetingUrl: z.string().url('Invalid meeting URL').optional().or(z.literal('')),
  interviewerIds: z.array(z.string()).min(1, 'At least one interviewer is required'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type InterviewFormValues = z.infer<typeof interviewSchema>;

export const companySchema = z.object({
  name: z.string().min(2, 'Company name is required').max(200).trim(),
  legalName: z.string().max(200).optional().or(z.literal('')),
  tagline: z.string().max(150).optional().or(z.literal('')),
  description: z.string().min(50, 'Company description must be at least 50 characters').max(5000),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  size: z.enum(
    ['SELF_EMPLOYED', '1_10', '11_50', '51_200', '201_500', '501_1000', '1001_5000', '5001_10000', '10001_PLUS'],
    { required_error: 'Please select company size' },
  ),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  headquarters: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(50).default(DEFAULT_COUNTRY),
  phone: z.string().max(20).optional().or(z.literal('')),
  supportEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  taxId: z.string().max(50).optional().or(z.literal('')),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtubeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100).trim(),
  category: z.string().max(50).optional().or(z.literal('')),
  level: z.number().int().min(1).max(5).optional().nullable(),
  isRequired: z.boolean().optional(),
});

export type SkillFormValues = z.infer<typeof skillSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100).trim(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().max(500).optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000).trim(),
  jobId: z.string().optional(),
  applicationId: z.string().optional(),
  interviewId: z.string().optional(),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  subject: z.string().min(2, 'Subject is required').max(200).trim(),
  message: z.string().min(20, 'Message must be at least 20 characters').max(5000).trim(),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
