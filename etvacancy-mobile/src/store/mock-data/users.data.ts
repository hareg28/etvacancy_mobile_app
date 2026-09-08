import type { User } from '@/types/index';

export const DEFAULT_REGISTERED_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@etvacancy.com',
    firstName: 'System',
    lastName: 'Admin',
    fullName: 'System Admin',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
    verificationStatus: 'VERIFIED',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  },
];
