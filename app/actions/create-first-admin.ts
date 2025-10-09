'use server';

import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';
import { createAuditLog } from './audit-log';
import { headers } from 'next/headers';

/**
 * Create the first admin user using Better Auth
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

    // Use Better Auth's signup endpoint
    const signupResult = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (signupResult.error) {
      return {
        success: false,
        error: signupResult.error.message || 'Failed to create admin account'
      };
    }

    // Promote the new user to admin
    if (signupResult.data?.user?.id) {
      await db
        .update(user)
        .set({
          role: 'admin',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, signupResult.data.user.id));

      // Get request metadata for audit log
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') ||
                        headersList.get('x-real-ip') ||
                        'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      // Create audit log entry
      await createAuditLog({
        userId: signupResult.data.user.id,
        action: 'FIRST_ADMIN_CREATED',
        resource: 'user',
        resourceId: signupResult.data.user.id,
        details: {
          email: data.email,
          name: data.name,
          tokenUsed: !!data.bootstrapToken,
        },
        ipAddress,
        userAgent,
      });

      return { success: true, userId: signupResult.data.user.id };
    }

    return { success: false, error: 'Failed to retrieve user ID after signup' };
  } catch (error) {
    console.error('Error creating first admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin account'
    };
  }
}
