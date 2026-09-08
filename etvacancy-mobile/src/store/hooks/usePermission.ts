import { useMemo } from 'react';
import type { User } from '@/types/index';
import { can as abacCan, createAbacContext, type PermissionAction, type PermissionSubject } from '@lib/abac';
import { useAuthStore } from '../slices/auth.slice';

export function usePermission(resource?: Record<string, unknown>) {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => {
    const ctx = user
      ? createAbacContext(user, resource)
      : createAbacContext(
          {
            id: '',
            email: '',
            role: 'PUBLIC',
            isActive: false,
            emailVerified: false,
            verificationStatus: 'UNVERIFIED',
            createdAt: '',
            updatedAt: '',
          } as unknown as User,
          resource,
        );
    return (action: PermissionAction, subject: PermissionSubject, res?: Record<string, unknown>) =>
      abacCan(action, subject, res ? { ...ctx, resource: res } : ctx);
  }, [user, resource]);
}
