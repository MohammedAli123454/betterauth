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

export async function requireRole(role: 'admin' | 'user') {
  const session = await requireAuth();

  if (session.user.role !== role && session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }

  return session;
}

export async function requireEmailVerified() {
  const session = await requireAuth();

  if (!session.user.emailVerified) {
    throw new Error('Email not verified');
  }

  return session;
}
