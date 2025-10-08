import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { nanoid } from 'nanoid';

/**
 * Audit Log Actions
 */
export const AuditAction = {
  // Employee actions
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE: 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
  EMPLOYEE_VIEW: 'EMPLOYEE_VIEW',

  // User actions
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_BAN: 'USER_BAN',
  USER_UNBAN: 'USER_UNBAN',

  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // System actions
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * Audit Log Resources
 */
export const AuditResource = {
  EMPLOYEE: 'employee',
  USER: 'user',
  AUTH: 'auth',
  SYSTEM: 'system',
} as const;

export type AuditResourceType = typeof AuditResource[keyof typeof AuditResource];

/**
 * Audit Log Entry Interface
 */
export interface AuditLogEntry {
  userId: string;
  action: AuditActionType;
  resource: AuditResourceType;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: nanoid(),
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error('[Audit Log] Failed to create audit log:', error);
  }
}

/**
 * Helper function to extract IP address from request
 */
export function getIpFromRequest(request: Request): string | undefined {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return cfConnectingIp || realIp || undefined;
}

/**
 * Helper function to get user agent from request
 */
export function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Log employee creation
 */
export async function logEmployeeCreate(
  userId: string,
  employeeId: string,
  employeeData: any,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.EMPLOYEE_CREATE,
    resource: AuditResource.EMPLOYEE,
    resourceId: employeeId,
    details: {
      name: employeeData.name,
      email: employeeData.email,
      position: employeeData.position,
      department: employeeData.department,
    },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}

/**
 * Log employee update
 */
export async function logEmployeeUpdate(
  userId: string,
  employeeId: string,
  changes: any,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.EMPLOYEE_UPDATE,
    resource: AuditResource.EMPLOYEE,
    resourceId: employeeId,
    details: { changes },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}

/**
 * Log employee deletion
 */
export async function logEmployeeDelete(
  userId: string,
  employeeId: string,
  employeeData: any,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.EMPLOYEE_DELETE,
    resource: AuditResource.EMPLOYEE,
    resourceId: employeeId,
    details: {
      name: employeeData.name,
      email: employeeData.email,
    },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}

/**
 * Log user role change
 */
export async function logUserRoleChange(
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId: adminUserId,
    action: AuditAction.USER_ROLE_CHANGE,
    resource: AuditResource.USER,
    resourceId: targetUserId,
    details: {
      oldRole,
      newRole,
    },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}

/**
 * Log user ban/unban
 */
export async function logUserBan(
  adminUserId: string,
  targetUserId: string,
  banned: boolean,
  reason?: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId: adminUserId,
    action: banned ? AuditAction.USER_BAN : AuditAction.USER_UNBAN,
    resource: AuditResource.USER,
    resourceId: targetUserId,
    details: {
      banned,
      reason,
    },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  userId: string,
  resource: string,
  recordCount: number,
  request?: Request
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.EXPORT_DATA,
    resource: AuditResource.SYSTEM,
    details: {
      exportedResource: resource,
      recordCount,
    },
    ipAddress: request ? getIpFromRequest(request) : undefined,
    userAgent: request ? getUserAgentFromRequest(request) : undefined,
  });
}
