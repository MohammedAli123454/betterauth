import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employee } from '@/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { nanoid } from 'nanoid';
import { slidingWindow } from '@arcjet/next';
import { findIp } from '@arcjet/ip';
import { auth } from '@/lib/auth';
import {
  aj,
  employeeCreationRateLimitSettings,
  employeeReadRateLimitSettings,
  arcjetErrorMessages,
} from '@/lib/arcjet-config';
import { logEmployeeCreate } from '@/lib/audit-logger';

// Rate limit for reading employees (generous)
async function protectGetRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userIdOrIp = session?.user.id || findIp(request) || '127.0.0.1';

  const decision = await aj
    .withRule(slidingWindow(employeeReadRateLimitSettings))
    .protect(request, { userIdOrIp });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { success: false, error: arcjetErrorMessages.rateLimit.employeeRead },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { success: false, error: arcjetErrorMessages.general.forbidden },
      { status: 403 }
    );
  }

  return null;
}

// Rate limit for creating employees (restrictive)
async function protectPostRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userIdOrIp = session?.user.id || findIp(request) || '127.0.0.1';

  const decision = await aj
    .withRule(slidingWindow(employeeCreationRateLimitSettings))
    .protect(request, { userIdOrIp });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        {
          success: false,
          error: arcjetErrorMessages.rateLimit.employeeCreate
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { success: false, error: arcjetErrorMessages.general.forbidden },
      { status: 403 }
    );
  }

  return null;
}

// GET /api/employees - List all employees (accessible by all authenticated users)
export async function GET(request: NextRequest) {
  const arcjetResponse = await protectGetRequest(request);
  if (arcjetResponse) return arcjetResponse;
  try {
    await requireRole(['user', 'super_user', 'admin']);

    const employees = await db.select().from(employee);

    return NextResponse.json({
      success: true,
      data: employees
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

// POST /api/employees - Create new employee (admin and super_user only)
export async function POST(request: NextRequest) {
  const arcjetResponse = await protectPostRequest(request);
  if (arcjetResponse) return arcjetResponse;

  try {
    const session = await requireRole(['admin', 'super_user']);

    const body = await request.json();
    const { name, email, position, department, salary, hireDate } = body;

    // Validation
    if (!name || !email || !position || !department || !salary || !hireDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create employee
    const employeeId = nanoid();
    const newEmployee = await db.insert(employee).values({
      id: employeeId,
      name,
      email,
      position,
      department,
      salary: salary.toString(),
      hireDate: new Date(hireDate),
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    // Log audit
    await logEmployeeCreate(
      session.user.id,
      employeeId,
      { name, email, position, department },
      request
    );

    return NextResponse.json(
      { success: true, data: newEmployee[0] },
      { status: 201 }
    );
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
