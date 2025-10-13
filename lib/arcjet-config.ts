import arcjet, {
  BotOptions,
  detectBot,
  EmailOptions,
  shield,
  ShieldOptions,
  SlidingWindowRateLimitOptions,
} from '@arcjet/next';

/**
 * Arcjet Configuration
 * Centralized security and rate limiting settings
 */

// ============================================
// Shield (WAF) Configuration
// ============================================
export const shieldSettings = {
  mode: 'LIVE',
} satisfies ShieldOptions;

// ============================================
// Bot Detection Configuration
// ============================================
export const botSettings = {
  mode: 'LIVE',
  allow: [], // Block all bots
} satisfies BotOptions;

// ============================================
// Base Arcjet Instance (with Shield + Bot Detection)
// ============================================
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['userIdOrIp'],
  rules: [
    shield(shieldSettings),
    detectBot(botSettings),
  ],
});

// ============================================
// Email Validation Configuration
// ============================================
export const emailSettings = {
  mode: 'LIVE',
  block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
} satisfies EmailOptions;

// ============================================
// Rate Limit Configurations
// ============================================

// Authentication: Login/Signup attempts
export const authRateLimitSettings = {
  mode: 'LIVE',
  max: 10, // 10 attempts per 10 minutes
  interval: '10m',
} satisfies SlidingWindowRateLimitOptions<[]>;

// General API requests (lax)
export const laxRateLimitSettings = {
  mode: 'LIVE',
  max: 60, // 60 requests per minute
  interval: '1m',
} satisfies SlidingWindowRateLimitOptions<[]>;

// Employee Creation (restrictive)
export const employeeCreationRateLimitSettings = {
  mode: 'LIVE',
  max: 2, // 2 employee creations per 10 minutes
  interval: '10m',
} satisfies SlidingWindowRateLimitOptions<[]>;

// Employee Read (generous)
export const employeeReadRateLimitSettings = {
  mode: 'LIVE',
  max: 100, // 100 reads per minute
  interval: '1m',
} satisfies SlidingWindowRateLimitOptions<[]>;

// ============================================
// Error Messages
// ============================================
export const arcjetErrorMessages = {
  rateLimit: {
    auth: 'Rate limit reached. You can only attempt login 10 times per 10 minutes. Please try again later.',
    employeeCreate: 'Rate limit reached. You can only create 2 employees per 10 minutes.',
    employeeRead: 'Too many requests. Please slow down.',
    default: 'Too many requests. Please try again later.',
  },
  email: {
    invalid: 'Email address format is invalid.',
    disposable: 'Disposable email addresses are not allowed.',
    noMxRecords: 'Email domain is not valid.',
    default: 'Invalid email.',
  },
  general: {
    forbidden: 'Access forbidden.',
  },
};

/**
 * Helper function to get email validation error message
 */
export function getEmailErrorMessage(emailTypes: string[]): string {
  if (emailTypes.includes('INVALID')) {
    return arcjetErrorMessages.email.invalid;
  } else if (emailTypes.includes('DISPOSABLE')) {
    return arcjetErrorMessages.email.disposable;
  } else if (emailTypes.includes('NO_MX_RECORDS')) {
    return arcjetErrorMessages.email.noMxRecords;
  }
  return arcjetErrorMessages.email.default;
}
