import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from '@/db';

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
