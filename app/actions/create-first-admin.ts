'use server';

import { z } from 'zod';
import { db } from '@/db';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createAuditLog } from './audit-log';
import { headers } from 'next/headers';

const createFirstAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  bootstrapToken: z.string().optional(),
});

/**
 * Create the first admin user using Better Auth server-side API
 * This should only be called when the user table is empty
 * Requires a bootstrap token if FIRST_ADMIN_BOOTSTRAP_TOKEN is set
 */
export async function createFirstAdmin(data: {
  email: string;
  password: string;
  name: string;
  bootstrapToken?: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Validate input data with Zod
    const validationResult = createFirstAdminSchema.safeParse(data);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return { success: false, error: errors };
    }

    // Double-check that no users exist
    const existingUsers = await db.select().from(user).limit(1);

    if (existingUsers.length > 0) {
      return { success: false, error: 'First admin already exists' };
    }

    // Validate bootstrap token if configured
    const requiredToken = process.env.FIRST_ADMIN_BOOTSTRAP_TOKEN;
    if (requiredToken) {
      if (!data.bootstrapToken) {
        return {
          success: false,
          error: 'Bootstrap token is required to create first admin'
        };
      }

      if (data.bootstrapToken !== requiredToken) {
        return {
          success: false,
          error: 'Invalid bootstrap token'
        };
      }
    }

    // Use Better Auth's server-side signUp API with admin role
    const signupResult = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'admin',
      },
    });

    // Check if signup was successful
    const userId = signupResult?.user?.id;

    if (!userId) {
      return { success: false, error: 'Failed to create admin account' };
    }

    // Get request metadata for audit log
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') ||
                      headersList.get('x-real-ip') ||
                      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Create audit log entry
    await createAuditLog({
      userId,
      action: 'FIRST_ADMIN_CREATED',
      resource: 'user',
      resourceId: userId,
      details: {
        email: data.email,
        name: data.name,
        tokenUsed: !!data.bootstrapToken,
      },
      ipAddress,
      userAgent,
    });

    return { success: true, userId };
  } catch (error) {
    console.error('Error creating first admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin account'
    };
  }
}
