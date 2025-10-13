import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
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

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and newPassword' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Use Better Auth's server-side admin API to set password
    // This will use Better Auth's default hashing
    // IMPORTANT: setUserPassword requires session cookies in headers
    const result = await auth.api.setUserPassword({
      body: {
        userId,
        newPassword,
      },
      headers: await headers(),
    });

    // Check if result indicates success
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    // Log errors in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('[Reset Password API Error]:', error);
      console.error('[Error Details]:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to reset password',
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    );
  }
}
