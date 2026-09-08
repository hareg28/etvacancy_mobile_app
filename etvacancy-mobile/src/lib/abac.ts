import type { User, UserRole, Permission } from '@/types/index';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'manage'
  | 'apply'
  | 'save'
  | 'review'
  | 'shortlist'
  | 'hire'
  | 'reject'
  | 'schedule'
  | 'publish'
  | 'archive'
  | 'verify'
  | 'impersonate';

export type PermissionSubject =
  | 'Job'
  | 'Company'
  | 'JobApplication'
  | 'Interview'
  | 'User'
  | 'JobSeekerProfile'
  | 'EmployerProfile'
  | 'Category'
  | 'Permission'
  | 'SavedJob'
  | 'Resume'
  | 'Report'
  | 'Analytics'
  | 'Settings'
  | 'Notification'
  | 'Skill'
  | 'Education'
  | 'WorkExperience'
  | 'Certification';

export interface AbacRule {
  role: UserRole;
  action: PermissionAction;
  subject: PermissionSubject;
  conditions?: AbacCondition[];
  fields?: string[];
  inverted?: boolean;
}

export interface AbacCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  value: unknown;
}

export interface AbacContext {
  user: User;
  resource?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

const allRoles: UserRole[] = ['PUBLIC', 'JOB_SEEKER', 'EMPLOYER', 'ADMIN'];
const authenticatedRoles: UserRole[] = ['JOB_SEEKER', 'EMPLOYER', 'ADMIN'];

export const abacRules = [
  { role: 'ADMIN', action: 'manage', subject: 'Settings' },
  { role: 'ADMIN', action: 'manage', subject: 'Analytics' },
  { role: 'ADMIN', action: 'manage', subject: 'Report' },
  { role: 'ADMIN', action: 'manage', subject: 'Permission' },
  { role: 'ADMIN', action: 'manage', subject: 'Category' },
  { role: 'ADMIN', action: 'verify', subject: 'Company' },
  { role: 'ADMIN', action: 'impersonate', subject: 'User' },

  ...authenticatedRoles.flatMap((role) => [
    { role, action: 'read' as const, subject: 'Notification' as const } as AbacRule,
    { role, action: 'update' as const, subject: 'Notification' as const } as AbacRule,
  ]),

  { role: 'PUBLIC', action: 'read', subject: 'Job' },
  { role: 'PUBLIC', action: 'list', subject: 'Job' },
  { role: 'PUBLIC', action: 'read', subject: 'Company' },
  { role: 'PUBLIC', action: 'list', subject: 'Company' },
  { role: 'PUBLIC', action: 'read', subject: 'Category' },
  { role: 'PUBLIC', action: 'list', subject: 'Category' },

  { role: 'JOB_SEEKER', action: 'create', subject: 'JobApplication' },
  { role: 'JOB_SEEKER', action: 'apply', subject: 'Job' },
  {
    role: 'JOB_SEEKER',
    action: 'list',
    subject: 'JobApplication',
    conditions: [{ field: 'applicantId', operator: 'eq', value: '{{user.id}}' }],
  },
  {
    role: 'JOB_SEEKER',
    action: 'read',
    subject: 'JobApplication',
    conditions: [{ field: 'applicantId', operator: 'eq', value: '{{user.id}}' }],
  },
  {
    role: 'JOB_SEEKER',
    action: 'update',
    subject: 'JobApplication',
    conditions: [
      { field: 'applicantId', operator: 'eq', value: '{{user.id}}' },
      { field: 'status', operator: 'in', value: ['PENDING', 'REVIEWED'] },
    ],
  },

  { role: 'JOB_SEEKER', action: 'create', subject: 'SavedJob' },
  { role: 'JOB_SEEKER', action: 'delete', subject: 'SavedJob' },
  {
    role: 'JOB_SEEKER',
    action: 'list',
    subject: 'SavedJob',
    conditions: [{ field: 'userId', operator: 'eq', value: '{{user.id}}' }],
  },

  { role: 'JOB_SEEKER', action: 'manage', subject: 'JobSeekerProfile' },
  {
    role: 'JOB_SEEKER',
    action: 'manage',
    subject: 'Resume',
    conditions: [{ field: 'userId', operator: 'eq', value: '{{user.id}}' }],
  },

  { role: 'JOB_SEEKER', action: 'create', subject: 'WorkExperience' },
  { role: 'JOB_SEEKER', action: 'update', subject: 'WorkExperience' },
  { role: 'JOB_SEEKER', action: 'delete', subject: 'WorkExperience' },
  { role: 'JOB_SEEKER', action: 'create', subject: 'Education' },
  { role: 'JOB_SEEKER', action: 'update', subject: 'Education' },
  { role: 'JOB_SEEKER', action: 'delete', subject: 'Education' },
  { role: 'JOB_SEEKER', action: 'create', subject: 'Certification' },
  { role: 'JOB_SEEKER', action: 'update', subject: 'Certification' },
  { role: 'JOB_SEEKER', action: 'delete', subject: 'Certification' },
  { role: 'JOB_SEEKER', action: 'create', subject: 'Skill' },
  { role: 'JOB_SEEKER', action: 'delete', subject: 'Skill' },

  {
    role: 'JOB_SEEKER',
    action: 'read',
    subject: 'Interview',
    conditions: [{ field: 'application.applicantId', operator: 'eq', value: '{{user.id}}' }],
  },
  {
    role: 'JOB_SEEKER',
    action: 'list',
    subject: 'Interview',
    conditions: [{ field: 'application.applicantId', operator: 'eq', value: '{{user.id}}' }],
  },

  { role: 'EMPLOYER', action: 'create', subject: 'Job' },
  {
    role: 'EMPLOYER',
    action: 'update',
    subject: 'Job',
    conditions: [{ field: 'companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'delete',
    subject: 'Job',
    conditions: [
      { field: 'companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' },
      { field: 'status', operator: 'in', value: ['DRAFT', 'PUBLISHED'] },
    ],
  },
  {
    role: 'EMPLOYER',
    action: 'publish',
    subject: 'Job',
    conditions: [{ field: 'companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'archive',
    subject: 'Job',
    conditions: [{ field: 'companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'list',
    subject: 'Job',
    conditions: [{ field: 'companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },

  { role: 'EMPLOYER', action: 'manage', subject: 'EmployerProfile' },
  {
    role: 'EMPLOYER',
    action: 'update',
    subject: 'Company',
    conditions: [{ field: 'id', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'read',
    subject: 'Company',
    conditions: [{ field: 'id', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },

  {
    role: 'EMPLOYER',
    action: 'list',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'read',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'review',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'shortlist',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'hire',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'reject',
    subject: 'JobApplication',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },

  {
    role: 'EMPLOYER',
    action: 'create',
    subject: 'Interview',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'schedule',
    subject: 'Interview',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'list',
    subject: 'Interview',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },
  {
    role: 'EMPLOYER',
    action: 'update',
    subject: 'Interview',
    conditions: [{ field: 'job.companyId', operator: 'eq', value: '{{user.employerProfile.companyId}}' }],
  },

  ...allRoles.flatMap((role) => [
    {
      role,
      action: 'read' as const,
      subject: 'User' as const,
      conditions: [{ field: 'id', operator: 'eq' as const, value: '{{user.id}}' }],
    } as AbacRule,
    {
      role,
      action: 'update' as const,
      subject: 'User' as const,
      conditions: [{ field: 'id', operator: 'eq' as const, value: '{{user.id}}' }],
    } as AbacRule,
  ]),

  { role: 'ADMIN', action: 'list', subject: 'User' },
  { role: 'ADMIN', action: 'read', subject: 'User' },
  { role: 'ADMIN', action: 'update', subject: 'User' },
  { role: 'ADMIN', action: 'delete', subject: 'User' },
  { role: 'ADMIN', action: 'list', subject: 'Company' },
  { role: 'ADMIN', action: 'read', subject: 'Company' },
  { role: 'ADMIN', action: 'update', subject: 'Company' },
  { role: 'ADMIN', action: 'delete', subject: 'Company' },
  { role: 'ADMIN', action: 'list', subject: 'Job' },
  { role: 'ADMIN', action: 'read', subject: 'Job' },
  { role: 'ADMIN', action: 'update', subject: 'Job' },
  { role: 'ADMIN', action: 'delete', subject: 'Job' },
  { role: 'ADMIN', action: 'list', subject: 'JobApplication' },
  { role: 'ADMIN', action: 'read', subject: 'JobApplication' },
  { role: 'ADMIN', action: 'list', subject: 'Interview' },
  { role: 'ADMIN', action: 'read', subject: 'Interview' },
] as AbacRule[];

function resolveTemplate(value: unknown, ctx: AbacContext): unknown {
  if (typeof value !== 'string') return value;
  if (!value.includes('{{')) return value;
  return value.replace(/\{\{([^}]+)\}\}/g, (_match, path) => {
    const keys = path.trim().split('.');
    let current: unknown = ctx;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return '';
      }
    }
    return String(current ?? '');
  });
}

function evaluateCondition(condition: AbacCondition, ctx: AbacContext, resource?: Record<string, unknown>): boolean {
  const resourceValue =
    resource && condition.field in resource ? (resource as Record<string, unknown>)[condition.field] : undefined;
  const resolvedValue = resolveTemplate(condition.value, ctx);

  switch (condition.operator) {
    case 'eq':
      return resourceValue === resolvedValue;
    case 'neq':
      return resourceValue !== resolvedValue;
    case 'in':
      return Array.isArray(resolvedValue) && resolvedValue.includes(resourceValue);
    case 'nin':
      return Array.isArray(resolvedValue) && !resolvedValue.includes(resourceValue);
    case 'gt':
      return typeof resourceValue === 'number' && resourceValue > (resolvedValue as number);
    case 'lt':
      return typeof resourceValue === 'number' && resourceValue < (resolvedValue as number);
    case 'gte':
      return typeof resourceValue === 'number' && resourceValue >= (resolvedValue as number);
    case 'lte':
      return typeof resourceValue === 'number' && resourceValue <= (resolvedValue as number);
    case 'contains':
      return (
        typeof resourceValue === 'string' &&
        typeof resolvedValue === 'string' &&
        resourceValue.includes(resolvedValue)
      );
    case 'exists':
      return resourceValue !== undefined && resourceValue !== null;
    default:
      return false;
  }
}

export function can(
  action: PermissionAction,
  subject: PermissionSubject,
  ctx: AbacContext,
  permissions?: Permission[],
): boolean {
  if (!ctx?.user) return false;
  if (ctx.user.role === 'ADMIN') return true;

  const applicableRules = abacRules.filter((r) => r.role === ctx.user.role);

  const matchedRules = applicableRules.filter((rule) => {
    const actionMatches = rule.action === action || rule.action === 'manage';
    const subjectMatches = rule.subject === subject;
    return actionMatches && subjectMatches;
  });

  if (matchedRules.length === 0) {
    return false;
  }

  for (const rule of matchedRules) {
    if (rule.conditions && rule.conditions.length > 0) {
      const resource = ctx.resource;
      const allConditionsPass = rule.conditions.every((condition) =>
        evaluateCondition(condition, ctx, resource),
      );
      if (!allConditionsPass) {
        continue;
      }
    }
    if (rule.inverted) return false;
    return true;
  }

  return false;
}

export function cannot(
  action: PermissionAction,
  subject: PermissionSubject,
  ctx: AbacContext,
  permissions?: Permission[],
): boolean {
  return !can(action, subject, ctx, permissions);
}

export function getAbilitiesForRole(role: UserRole): AbacRule[] {
  return abacRules.filter((r) => r.role === role);
}

export function createAbacContext(user: User, resource?: Record<string, unknown>): AbacContext {
  return { user, resource };
}
