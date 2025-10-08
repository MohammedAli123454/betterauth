import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLog, user } from '@/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { desc, and, eq, gte, lte } from 'drizzle-orm';
import { logDataExport } from '@/lib/audit-logger';

// GET /api/audit-logs/export - Export audit logs to CSV (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);

    const { searchParams } = new URL(request.url);

    // Filters
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [];
    if (action) conditions.push(eq(auditLog.action, action));
    if (resource) conditions.push(eq(auditLog.resource, resource));
    if (userId) conditions.push(eq(auditLog.userId, userId));
    if (startDate) conditions.push(gte(auditLog.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLog.createdAt, new Date(endDate)));

    // Get all logs matching filters (no pagination)
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
        userName: user.name,
        userEmail: user.email,
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt));

    // Convert to CSV
    const csvHeader = 'ID,Action,Resource,Resource ID,User Name,User Email,IP Address,Details,Created At\n';
    const csvRows = logs
      .map((log) => {
        const details = log.details ? JSON.parse(log.details) : {};
        const detailsStr = JSON.stringify(details).replace(/"/g, '""');
        return [
          log.id,
          log.action,
          log.resource,
          log.resourceId || '',
          log.userName || '',
          log.userEmail || '',
          log.ipAddress || '',
          `"${detailsStr}"`,
          log.createdAt.toISOString(),
        ].join(',');
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    // Log the export
    await logDataExport(session.user.id, 'audit_logs', logs.length, request);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
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

    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
