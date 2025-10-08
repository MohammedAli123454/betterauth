import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employee } from '@/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { findIp } from '@arcjet/ip';
import { auth } from '@/lib/auth';

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['userIdOrIp'],
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({ mode: 'LIVE' }),
    slidingWindow({
      mode: 'LIVE',
      max: 100,
      interval: '1m',
    }),
  ],
});

async function protectRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userIdOrIp = (session?.user.id ?? findIp(request)) || '127.0.0.1';

  const decision = await aj.protect(request, { userIdOrIp });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Access forbidden.' },
      { status: 403 }
    );
  }

  return null;
}

// PATCH /api/employees/[id] - Update employee (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const arcjetResponse = await protectRequest(request);
  if (arcjetResponse) return arcjetResponse;

  try {
    const session = await requireRole(['admin']);
    const { id } = await params;
    const body = await request.json();

    const { name, email, position, department, salary, hireDate } = body;

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(employee)
      .where(eq(employee.id, id))
      .limit(1);

    if (!existingEmployee.length) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Update employee
    const updatedEmployee = await db
      .update(employee)
      .set({
        ...(name && { name }),
        ...(email && { email }),
        ...(position && { position }),
        ...(department && { department }),
        ...(salary && { salary: salary.toString() }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(employee.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedEmployee[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access Denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const arcjetResponse = await protectRequest(request);
  if (arcjetResponse) return arcjetResponse;

  try {
    await requireRole(['admin']);
    const { id } = await params;

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(employee)
      .where(eq(employee.id, id))
      .limit(1);

    if (!existingEmployee.length) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete employee
    await db.delete(employee).where(eq(employee.id, id));

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access Denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
