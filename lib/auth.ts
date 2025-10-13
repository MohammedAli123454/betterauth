import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from '@/db';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Password hashing using scrypt algorithm
 * Format: base64(salt + derivedKey) where salt is 32 bytes and derivedKey is 64 bytes
 */
async function hashPassword(password: string): Promise<string> {
  // Generate a 32-byte salt
  const salt = randomBytes(32);

  // Hash the password with scrypt (64-byte output)
  const derivedKey = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    64
  ) as Buffer;

  // Combine salt + hash and encode as base64
  const combined = Buffer.concat([salt, derivedKey]);
  return combined.toString('base64');
}

/**
 * Password verification using scrypt algorithm
 * Verifies passwords hashed with the hashPassword function
 */
async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) return false;

  try {
    // Decode the base64 hash
    const hashBuffer = Buffer.from(hash, 'base64');

    // Verify buffer has correct length (32-byte salt + 64-byte hash = 96 bytes)
    if (hashBuffer.length !== 96) {
      return false;
    }

    // Extract salt and stored hash
    const salt = hashBuffer.subarray(0, 32);
    const storedHash = hashBuffer.subarray(32);

    // Derive key from provided password with same salt
    const derivedKey = await scryptAsync(
      password.normalize('NFKC'),
      salt,
      64
    ) as Buffer;

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(derivedKey, storedHash);
  } catch {
    return false;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // Base URL for production/development
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Session configuration for optimal performance
  session: {
    cookieCache: {
      enabled: true, // Enable cookie caching to reduce database hits
      maxAge: 5 * 60, // Cache for 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session once per day
    freshAge: 60 * 60, // Consider session fresh for 1 hour
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      // Custom hash function to ensure consistent password format
      hash: async (password: string) => hashPassword(password),
      // Custom verify function to support legacy password formats
      verify: async ({ hash, password }) => verifyPassword(hash, password),
    },
  },

  // User schema with additional fields
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        required: false,
        returned: true, // Always return role in session
      },
    },
  },

  // Advanced options
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // Enable if using multiple subdomains
    },
  },

  // Trust host for production (disable in dev for debugging)
  trustedOrigins: process.env.NODE_ENV === 'production'
    ? [process.env.NEXT_PUBLIC_APP_URL!]
    : undefined,

  // Plugins
  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultRole: 'user', // Default role for new users
    }),
  ],
});
