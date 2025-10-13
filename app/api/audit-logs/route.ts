import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLog, user } from '@/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { desc, and, eq, gte, lte, like, or } from 'drizzle-orm';

// GET /api/audit-logs - List audit logs with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where conditions
    const conditions = [];
    if (action) conditions.push(eq(auditLog.action, action));
    if (resource) conditions.push(eq(auditLog.resource, resource));
    if (userId) conditions.push(eq(auditLog.userId, userId));
    if (startDate) conditions.push(gte(auditLog.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLog.createdAt, new Date(endDate)));
    if (search) {
      conditions.push(
        or(
          like(auditLog.action, `%${search}%`),
          like(auditLog.resource, `%${search}%`),
          like(auditLog.resourceId, `%${search}%`)
        )
      );
    }

    // Get audit logs with user info
    const logs = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: auditLog.id })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
