'use server';

import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { nanoid } from 'nanoid';

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: nanoid(),
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}
