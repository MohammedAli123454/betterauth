import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { employee } from '@/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/next';
import { findIp } from '@arcjet/ip';
import { auth } from '@/lib/auth';

// Base Arcjet instance with shield and bot detection
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['userId'], // Track by userId instead of IP
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: [], // Block all automated requests
    }),
  ],
});

// Rate limit for reading employees (generous)
async function protectGetRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user.id || findIp(request) || '127.0.0.1';

  const decision = await aj
    .withRule(
      slidingWindow({
        mode: 'LIVE',
        max: 100, // 100 reads per minute
        interval: '1m',
      })
    )
    .protect(request, { userId });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
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

// Rate limit for creating employees (restrictive)
async function protectPostRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user.id || findIp(request) || '127.0.0.1';

  const decision = await aj
    .withRule(
      slidingWindow({
        mode: 'LIVE',
        max: 2, // Only 2 employee creations per 10 minutes
        interval: '10m',
      })
    )
    .protect(request, { userId });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit reached. You can only create 2 employees per 10 minutes.'
        },
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

// GET /api/employees - List all employees (accessible by all authenticated users)
export async function GET(request: NextRequest) {
  const arcjetResponse = await protectGetRequest(request);
  if (arcjetResponse) return arcjetResponse;
  try {
    const session = await requireRole(['user', 'super_user', 'admin']);

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
    const newEmployee = await db.insert(employee).values({
      id: nanoid(),
      name,
      email,
      position,
      department,
      salary: salary.toString(),
      hireDate: new Date(hireDate),
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

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
