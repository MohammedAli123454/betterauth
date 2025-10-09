'use server';

import { db } from '@/db';
import { user } from '@/db/schema';

/**
 * Check if the user table is empty (no users exist)
 * This is used to determine if we should show signup form for first admin
 * @returns Object with isEmpty status and whether bootstrap token is required
 */
export async function checkIsFirstUser(): Promise<{
  isEmpty: boolean;
  requiresToken: boolean;
}> {
  try {
    const users = await db.select().from(user).limit(1);
    const isEmpty = users.length === 0;

    // Check if bootstrap token is configured
    const requiresToken = isEmpty && !!process.env.FIRST_ADMIN_BOOTSTRAP_TOKEN;

    return {
      isEmpty,
      requiresToken,
    };
  } catch (error) {
    console.error('Error checking first user:', error);
    return {
      isEmpty: false, // Default to false (show login) on error
      requiresToken: false,
    };
  }
}
