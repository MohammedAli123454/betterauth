import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true when email service is configured
  },
  // OAuth Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
  // Email configuration for verification emails
  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url }) => {
  //     // In production, use a real email service like Resend, SendGrid, etc.
  //     console.log(`Send verification email to ${user.email}: ${url}`);
  //     // Example with Resend:
  //     // await resend.emails.send({
  //     //   from: 'noreply@yourdomain.com',
  //     //   to: user.email,
  //     //   subject: 'Verify your email',
  //     //   html: `Click here to verify: <a href="${url}">${url}</a>`
  //     // });
  //   },
  // },
});
