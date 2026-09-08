import { Platform } from 'react-native';

declare const globalThis: {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const env = globalThis.process?.env ?? {};

const DEFAULT_API_HOST =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL =
  env.EXPO_PUBLIC_API_BASE_URL || `${DEFAULT_API_HOST}/api`;

export const GEMINI_API_KEY =
  env.EXPO_PUBLIC_GEMINI_API_KEY ||
  env.GEMINI_API_KEY ||
  '';


export const APP_NAME = 'EtVacancy';
export const APP_TAGLINE = 'Find Your Dream Job in Ethiopia';
export const APP_SUPPORT_EMAIL = 'support@etvacancy.com';
export const APP_PHONE = '+251-111-123456';
export const APP_ADDRESS = 'Addis Ababa, Ethiopia';

export const DEFAULT_COUNTRY = 'Ethiopia';
export const DEFAULT_CURRENCY = 'ETB';
export const DEFAULT_TIMEZONE = 'Africa/Addis_Ababa';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'etvacancy.auth.token',
  REFRESH_TOKEN: 'etvacancy.auth.refreshToken',
  USER: 'etvacancy.auth.user',
  ONBOARDING_COMPLETE: 'etvacancy.onboarding.complete',
  PREFERRED_LANGUAGE: 'etvacancy.settings.language',
  PREFERRED_THEME: 'etvacancy.settings.theme',
  FILTERS_CACHE: 'etvacancy.filters.cache',
};

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'or', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
] as const;

export const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level', years: '0-1 years' },
  { value: 'JUNIOR', label: 'Junior', years: '1-3 years' },
  { value: 'MID', label: 'Mid Level', years: '3-5 years' },
  { value: 'SENIOR', label: 'Senior', years: '5-8 years' },
  { value: 'LEAD', label: 'Lead / Principal', years: '8-12 years' },
  { value: 'EXECUTIVE', label: 'Executive', years: '12+ years' },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
] as const;

export const SALARY_PERIODS = [
  { value: 'HOURLY', label: 'Per Hour' },
  { value: 'DAILY', label: 'Per Day' },
  { value: 'WEEKLY', label: 'Per Week' },
  { value: 'MONTHLY', label: 'Per Month' },
  { value: 'YEARLY', label: 'Per Year' },
] as const;

export const SALARY_CURRENCIES = [
  { value: 'ETB', label: 'Ethiopian Birr', symbol: 'Br' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
] as const;

export const COMPANY_SIZES = [
  { value: 'SELF_EMPLOYED', label: 'Self-employed', employees: '1' },
  { value: '1_10', label: '1-10 employees', employees: '1-10' },
  { value: '11_50', label: '11-50 employees', employees: '11-50' },
  { value: '51_200', label: '51-200 employees', employees: '51-200' },
  { value: '201_500', label: '201-500 employees', employees: '201-500' },
  { value: '501_1000', label: '501-1,000 employees', employees: '501-1000' },
  { value: '1001_5000', label: '1,001-5,000 employees', employees: '1001-5000' },
  { value: '5001_10000', label: '5,001-10,000 employees', employees: '5001-10000' },
  { value: '10001_PLUS', label: '10,001+ employees', employees: '10000+' },
] as const;

export const APPLICATION_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#F59E0B', icon: 'time-outline' },
  REVIEWED: { label: 'Reviewed', color: '#3B82F6', icon: 'eye-outline' },
  SHORTLISTED: { label: 'Shortlisted', color: '#1D4ED8', icon: 'heart-outline' },
  INTERVIEW: { label: 'Interview', color: '#7C3AED', icon: 'calendar-outline' },
  OFFERED: { label: 'Offered', color: '#10B981', icon: 'gift-outline' },
  HIRED: { label: 'Hired', color: '#059669', icon: 'checkmark-done-outline' },
  REJECTED: { label: 'Rejected', color: '#EF4444', icon: 'close-circle-outline' },
  WITHDRAWN: { label: 'Withdrawn', color: '#6B7280', icon: 'arrow-undo-outline' },
};

export const APPLICATION_STATUS_NEXT_ACTIONS: Record<string, Array<{ status: string; label: string; icon: string }>> = {
  PENDING: [
    { status: 'REVIEWED', label: 'Mark Reviewed', icon: 'eye-outline' },
    { status: 'SHORTLISTED', label: 'Shortlist', icon: 'heart-outline' },
    { status: 'REJECTED', label: 'Reject', icon: 'close-circle-outline' },
  ],
  REVIEWED: [
    { status: 'SHORTLISTED', label: 'Shortlist', icon: 'heart-outline' },
    { status: 'INTERVIEW', label: 'Schedule Interview', icon: 'calendar-outline' },
    { status: 'REJECTED', label: 'Reject', icon: 'close-circle-outline' },
  ],
  SHORTLISTED: [
    { status: 'INTERVIEW', label: 'Schedule Interview', icon: 'calendar-outline' },
    { status: 'OFFERED', label: 'Send Offer', icon: 'gift-outline' },
    { status: 'REJECTED', label: 'Reject', icon: 'close-circle-outline' },
  ],
  INTERVIEW: [
    { status: 'OFFERED', label: 'Send Offer', icon: 'gift-outline' },
    { status: 'HIRED', label: 'Mark Hired', icon: 'checkmark-done-outline' },
    { status: 'REJECTED', label: 'Reject', icon: 'close-circle-outline' },
  ],
  OFFERED: [
    { status: 'HIRED', label: 'Mark Hired', icon: 'checkmark-done-outline' },
    { status: 'REJECTED', label: 'Rescind Offer', icon: 'close-circle-outline' },
  ],
};

export const INTERVIEW_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'primary' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'neutral' },
  NO_SHOW: { label: 'No Show', color: 'danger' },
};

export const INTERVIEW_TYPES = [
  { value: 'PHONE', label: 'Phone Call', icon: 'phone' },
  { value: 'VIDEO', label: 'Video Call', icon: 'video' },
  { value: 'IN_PERSON', label: 'In Person', icon: 'users' },
  { value: 'ASSESSMENT', label: 'Assessment / Test', icon: 'file-text' },
] as const;

export const EDUCATION_LEVELS = [
  { value: 'HIGH_SCHOOL', label: 'High School / Secondary' },
  { value: 'DIPLOMA', label: 'Diploma / Associate' },
  { value: 'ASSOCIATE', label: 'Associate Degree' },
  { value: 'BACHELOR', label: "Bachelor's Degree" },
  { value: 'MASTER', label: "Master's Degree" },
  { value: 'DOCTORATE', label: 'PhD / Doctorate' },
  { value: 'CERTIFICATION', label: 'Professional Certification' },
] as const;

export const LANGUAGE_PROFICIENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner (A1)', description: 'Basic understanding' },
  { value: 'ELEMENTARY', label: 'Elementary (A2)', description: 'Can communicate in simple terms' },
  { value: 'INTERMEDIATE', label: 'Intermediate (B1)', description: 'Can handle most situations' },
  { value: 'UPPER_INTERMEDIATE', label: 'Upper Intermediate (B2)', description: 'Fluent in social and professional contexts' },
  { value: 'ADVANCED', label: 'Advanced (C1)', description: 'Near-native fluency' },
  { value: 'NATIVE', label: 'Native / Bilingual (C2)', description: 'Full professional proficiency' },
] as const;

export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Central Ethiopia',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'Southwest Ethiopia',
  'Tigray',
];

export const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Adama',
  'Dire Dawa',
  'Hawassa',
  'Mekelle',
  'Bahir Dar',
  'Jimma',
  'Gondar',
  'Nekemte',
  'Dessie',
  'Jijiga',
  'Shashamane',
  'Bishoftu',
  'Sodo',
  'Arba Minch',
  'Hosaena',
  'Dila',
  'Harar',
  'Debre Birhan',
  'Asella',
  'Debre Markos',
  'Aksum',
  'Wolaita Sodo',
  'Mizan Teferi',
  'Gambela',
];

export const MAJOR_INDUSTRIES = [
  'Technology / IT',
  'Banking & Finance',
  'Healthcare / Medical',
  'Education',
  'Manufacturing',
  'Agriculture / Agribusiness',
  'Construction & Engineering',
  'Retail & E-commerce',
  'Hospitality & Tourism',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Telecommunications',
  'Government / Public Sector',
  'NGO / Non-Profit',
  'Consulting',
  'Media & Entertainment',
  'Marketing & Advertising',
  'Law & Legal Services',
  'Real Estate',
  'Automotive',
  'Pharmaceuticals',
  'Food & Beverage',
  'Textile & Apparel',
  'Mining & Natural Resources',
  'Aviation & Aerospace',
];

export const ROLE_LABELS = {
  PUBLIC: 'Public',
  JOB_SEEKER: 'Job Seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Administrator',
} as const;

export const GOOGLE_OAUTH_CONFIG = {
  iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  redirectUri:
    env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 'etvacancy://oauthredirect/google',
  scopes: ['openid', 'profile', 'email'],
  discoveryEndpoint: 'https://accounts.google.com/.well-known/openid-configuration',
} as const;

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  APPLE: 'apple',
  FACEBOOK: 'facebook',
} as const;

export const COLORS = {
  primary: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  secondary: '#2563EB',
  secondaryLight: '#60A5FA',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  backgroundLight: '#F8FAFC',
  backgroundDark: '#0F172A',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1E293B',
  textPrimaryLight: '#0F172A',
  textPrimaryDark: '#F8FAFC',
  textSecondaryLight: '#64748B',
  textSecondaryDark: '#94A3B8',
  borderLight: '#E2E8F0',
  borderDark: '#334155',
  google: '#4285F4',
  googleRed: '#EA4335',
  googleYellow: '#FBBC04',
  googleGreen: '#34A853',
  googleLight: '#EA4335',
} as const;
