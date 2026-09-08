import type { Category } from '@/types/index';

export const REAL_CATEGORIES: Category[] = [
  { id: 'cat-software', name: 'Software & Tech', slug: 'software', icon: 'code-slash-outline', sortOrder: 1, isActive: true, jobsCount: 142 },
  { id: 'cat-it', name: 'Information Technology', slug: 'it', icon: 'hardware-chip-outline', sortOrder: 2, isActive: true, jobsCount: 98 },
  { id: 'cat-accounting', name: 'Accounting & Finance', slug: 'accounting', icon: 'calculator-outline', sortOrder: 3, isActive: true, jobsCount: 85 },
  { id: 'cat-medicine', name: 'Medicine & Healthcare', slug: 'medicine', icon: 'medical-outline', sortOrder: 4, isActive: true, jobsCount: 74 },
  { id: 'cat-engineering', name: 'Engineering & Construction', slug: 'engineering', icon: 'construct-outline', sortOrder: 5, isActive: true, jobsCount: 62 },
  { id: 'cat-education', name: 'Education & Teaching', slug: 'education', icon: 'school-outline', sortOrder: 6, isActive: true, jobsCount: 53 },
  { id: 'cat-banking', name: 'Banking & Insurance', slug: 'banking', icon: 'card-outline', sortOrder: 7, isActive: true, jobsCount: 91 },
  { id: 'cat-marketing', name: 'Marketing & Sales', slug: 'marketing', icon: 'trending-up-outline', sortOrder: 8, isActive: true, jobsCount: 68 },
  { id: 'cat-customer-service', name: 'Customer Service & Admin', slug: 'customer-service', icon: 'headset-outline', sortOrder: 9, isActive: true, jobsCount: 39 },
  { id: 'cat-hr', name: 'Human Resources (HR)', slug: 'human-resources', icon: 'people-outline', sortOrder: 10, isActive: true, jobsCount: 31 },
  { id: 'cat-logistics', name: 'Logistics & Supply Chain', slug: 'logistics', icon: 'bus-outline', sortOrder: 11, isActive: true, jobsCount: 48 },
  { id: 'cat-ngo', name: 'NGO & Social Services', slug: 'ngo', icon: 'globe-outline', sortOrder: 12, isActive: true, jobsCount: 115 },
];
