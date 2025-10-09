import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const users = await db
      .select()
      .from(user)
      .orderBy(asc(user.createdAt))
      .limit(200);

    return NextResponse.json({ users });
  } catch (error) {
    // Log errors in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin API Error]:', error);
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
