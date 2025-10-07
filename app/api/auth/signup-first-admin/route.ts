import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Check if this would be the first user
    const existingUsers = await db.select().from(user).limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'First admin already exists' },
        { status: 400 }
      );
    }

    // Call Better Auth's signup endpoint
    const signupUrl = new URL('/api/auth/sign-up/email', request.url);
    const signupResponse = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok) {
      return NextResponse.json(signupData, { status: signupResponse.status });
    }

    // Promote the new user to admin
    if (signupData.user?.id) {
      await db
        .update(user)
        .set({
          role: 'admin',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, signupData.user.id));
    }

    return NextResponse.json(signupData);
  } catch (error) {
    console.error('Error creating first admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
