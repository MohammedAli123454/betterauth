# Arcjet Configuration Guide

This file contains all centralized Arcjet security and rate limiting configurations for the application.

## File Location
`/lib/arcjet-config.ts`

## Configuration Structure

### 1. Base Arcjet Instance (`aj`)
The main Arcjet instance with default Shield (WAF) and Bot Detection rules.

```typescript
import { aj } from '@/lib/arcjet-config';
```

### 2. Shield (WAF) Configuration
Web Application Firewall protection against common attacks.

**Current Settings:**
- **Mode:** `LIVE` (actively blocking attacks)

**Protects Against:**
- SQL Injection
- XSS (Cross-Site Scripting)
- Path Traversal
- Command Injection

### 3. Bot Detection
Blocks automated bots and scrapers.

**Current Settings:**
- **Mode:** `LIVE`
- **Allow:** `[]` (blocks all bots)

### 4. Email Validation
Validates emails during signup/registration.

**Current Settings:**
- **Mode:** `LIVE`
- **Blocks:** Disposable emails, invalid formats, domains without MX records

### 5. Rate Limiting Configurations

#### Authentication Rate Limit (`authRateLimitSettings`)
- **Max:** 2 attempts
- **Interval:** 10 minutes
- **Applied to:** Login and signup endpoints
- **Error Message:** "Rate limit reached. You can only attempt login 2 times per 10 minutes. Please try again later."

#### Employee Creation Rate Limit (`employeeCreationRateLimitSettings`)
- **Max:** 2 creations
- **Interval:** 10 minutes
- **Applied to:** POST /api/employees
- **Error Message:** "Rate limit reached. You can only create 2 employees per 10 minutes."

#### Employee Read Rate Limit (`employeeReadRateLimitSettings`)
- **Max:** 100 reads
- **Interval:** 1 minute
- **Applied to:** GET /api/employees
- **Error Message:** "Too many requests. Please slow down."

#### Lax Rate Limit (`laxRateLimitSettings`)
- **Max:** 60 requests
- **Interval:** 1 minute
- **Applied to:** General authentication operations

## How to Use

### Import in Your Route

```typescript
import {
  aj,
  authRateLimitSettings,
  employeeCreationRateLimitSettings,
  arcjetErrorMessages,
} from '@/lib/arcjet-config';
```

### Apply Rate Limiting

```typescript
const decision = await aj
  .withRule(slidingWindow(authRateLimitSettings))
  .protect(request, { userIdOrIp });

if (decision.isDenied()) {
  if (decision.reason.isRateLimit()) {
    return Response.json(
      { error: arcjetErrorMessages.rateLimit.auth },
      { status: 429 }
    );
  }
}
```

## Customizing Rate Limits

To change rate limits, edit `/lib/arcjet-config.ts`:

```typescript
export const employeeCreationRateLimitSettings = {
  mode: 'LIVE',
  max: 5,        // Change from 2 to 5
  interval: '1h', // Change from 10m to 1 hour
} satisfies SlidingWindowRateLimitOptions<[]>;
```

### Available Intervals
- `'1s'` - 1 second
- `'1m'` - 1 minute
- `'10m'` - 10 minutes
- `'1h'` - 1 hour
- `'24h'` - 24 hours

## Error Messages

All error messages are centralized in `arcjetErrorMessages` object:

```typescript
export const arcjetErrorMessages = {
  rateLimit: {
    auth: '...',
    employeeCreate: '...',
    employeeRead: '...',
  },
  email: {
    invalid: '...',
    disposable: '...',
    noMxRecords: '...',
  },
  general: {
    forbidden: 'Access forbidden.',
  },
};
```

## Helper Functions

### `getEmailErrorMessage(emailTypes: string[])`
Returns appropriate email validation error message based on the validation failure type.

```typescript
const message = getEmailErrorMessage(decision.reason.emailTypes);
// Returns: "Email address format is invalid." or similar
```

## Files Using This Configuration

1. `/app/api/auth/[...all]/route.ts` - Authentication endpoints
2. `/app/api/employees/route.ts` - Employee CRUD operations
3. `/app/api/employees/[id]/route.ts` - Individual employee operations (if applicable)

## Testing Rate Limits

### Test Login Rate Limit
1. Go to `/login`
2. Try wrong password 3 times
3. 3rd attempt should be blocked

### Test Employee Creation Rate Limit
1. Go to `/employees`
2. Create 3 employees quickly
3. 3rd attempt should be blocked

## Monitoring

Check your Arcjet dashboard at https://app.arcjet.com to see:
- Blocked requests
- Rate limit violations
- Bot detection events
- Shield (WAF) blocks

## Environment Variables

Required in `.env.local`:
```
ARCJET_KEY=your_arcjet_api_key
```

## Production Considerations

- All settings are in `LIVE` mode (actively blocking)
- Use `DRY_RUN` mode for testing without blocking
- Monitor Arcjet dashboard for false positives
- Adjust rate limits based on actual usage patterns
