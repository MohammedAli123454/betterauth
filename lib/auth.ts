import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createFieldAttribute } from 'better-auth/db';
import { admin } from 'better-auth/plugins';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  // OAuth Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      disableSignUp: true,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      disableSignUp: true,
    },
  },
  user: {
    additionalFields: {
      role: createFieldAttribute('string', {
        defaultValue: 'user',
        fieldName: 'role',
        input: false,
      }),
    },
  },
  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
});
