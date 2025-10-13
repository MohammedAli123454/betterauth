import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    // Note: Better Auth doesn't provide a direct admin API for updating user details
    // so we use the database directly while respecting Better Auth's schema
    const updates: Partial<{ name: string; email: string; updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (email !== undefined) {
      updates.email = email;
    }

    // Update user in database using Better Auth's schema
    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    // Log errors in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Update User API Error]:', error);
    }

    // Check for unique constraint violation (duplicate email)
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
