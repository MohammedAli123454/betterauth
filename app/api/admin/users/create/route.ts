import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

export async function POST(request: Request) {
  try {
    await requireRole('admin');

    const body = await request.json();
    const { email, name, password, role } = body;

    // Validate input
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      email,
      name,
      role: role || 'user',
      emailVerified: true, // Admin-created users are auto-verified
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create account entry for password
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: email,
      providerId: 'credential',
      userId,
      password: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
