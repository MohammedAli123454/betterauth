import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { db } from '@/db';
import { user } from '@/db/schema';

export async function GET() {
  try {
    await requireRole('admin');

    const users = await db.select().from(user);

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
