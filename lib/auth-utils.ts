import { auth } from './auth';
import { headers } from 'next/headers';

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
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
