import { pgTable, text, timestamp, boolean, numeric, index } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'), // user, super_user, admin
  banned: boolean('banned').notNull().default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Index for faster session lookups by user
  userIdIdx: index('session_user_id_idx').on(table.userId),
  // Index for faster session token lookups (already unique, but explicit index)
  tokenIdx: index('session_token_idx').on(table.token),
  // Index for cleaning up expired sessions
  expiresAtIdx: index('session_expires_at_idx').on(table.expiresAt),
}));

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
  password: text('password'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
});

export const employee = pgTable('employee', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }).notNull(),
  hireDate: timestamp('hireDate', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  createdBy: text('createdBy').references(() => user.id),
  updatedBy: text('updatedBy').references(() => user.id),
}, (table) => ({
  // Index for faster department filtering
  departmentIdx: index('employee_department_idx').on(table.department),
  // Index for faster email lookups
  emailIdx: index('employee_email_idx').on(table.email),
  // Index for audit tracking
  createdByIdx: index('employee_created_by_idx').on(table.createdBy),
}));

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource: text('resource').notNull(), // employee, user, etc.
  resourceId: text('resourceId'), // ID of the affected resource
  details: text('details'), // JSON string with additional details
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Index for faster user audit queries
  userIdIdx: index('audit_log_user_id_idx').on(table.userId),
  // Index for faster resource lookups
  resourceIdx: index('audit_log_resource_idx').on(table.resource),
  // Composite index for resource + resourceId
  resourceIdIdx: index('audit_log_resource_id_idx').on(table.resource, table.resourceId),
  // Index for time-based queries
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
}));
