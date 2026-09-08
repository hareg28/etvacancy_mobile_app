/**
 * Central API Barrel Export
 * Fully modularized with domain-driven endpoints and clean interceptors.
 */

// Client & Error Handling
export { apiClient, createApiClient } from './client';
export { handleApiError } from './error-handler';

// Domain Endpoints
export { auth, authApi } from './modules/auth.api';
export { jobs, EMPTY_PAGINATED_JOBS } from './modules/jobs.api';
export { savedJobs } from './modules/saved-jobs.api';
export { companies } from './modules/companies.api';
export { categories } from './modules/categories.api';
export { REAL_CATEGORIES } from './modules/categories.data';
export { applications } from './modules/applications.api';
export { interviews } from './modules/interviews.api';
export { users } from './modules/users.api';
export { profile, experiences, education, certifications, skills } from './modules/profile.api';
export { admin } from './modules/admin.api';
