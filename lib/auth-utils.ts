import { headers } from 'next/headers';
import { auth } from './auth';

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function requireAuth(): Promise<AuthSession> {
  const sessionResponse = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionResponse || !sessionResponse.user) {
    throw new Error('Unauthorized');
  }

  return sessionResponse;
}

export type UserRole = 'user' | 'super_user' | 'admin';

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const userRole = session.user.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Access Denied: Required role(s): ${allowedRoles.join(', ')}`);
  }

  return session;
}

export function hasPermission(userRole: UserRole, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
  const permissions = {
    admin: ['view', 'create', 'edit', 'delete'],
    super_user: ['view', 'create'],
    user: ['view'],
  };

  return permissions[userRole]?.includes(action) || false;
}

export async function requireEmailVerified() {
  const session = await requireAuth();

  if (!session.user.emailVerified) {
    throw new Error('Email not verified');
  }

  return session;
}
