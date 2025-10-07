import { NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';

export async function GET() {
  try {
    const users = await db.select().from(user).limit(1);
    return NextResponse.json({ isEmpty: users.length === 0 });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json({ isEmpty: false }, { status: 500 });
  }
}
