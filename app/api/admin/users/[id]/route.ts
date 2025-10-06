import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin');

    const body = await request.json();
    const { name, role, emailVerified } = body;

    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    await db.update(user).set(updateData).where(eq(user.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('admin');

    // Prevent deleting yourself
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await db.delete(user).where(eq(user.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
