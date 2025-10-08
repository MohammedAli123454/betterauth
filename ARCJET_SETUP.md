# 🔒 Arcjet Security Setup Guide

## Overview

Arcjet is now integrated into your authentication system, providing multiple layers of security:

- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **Bot Detection** - Block automated attacks
- ✅ **Email Validation** - Reject disposable/invalid emails
- ✅ **Shield (WAF)** - Web Application Firewall protection

---

## 🚀 Quick Setup

### 1. Get Your Arcjet API Key

1. Go to [arcjet.com](https://arcjet.com)
2. Sign up for a free account (no credit card required)
3. Create a new site/app
4. Copy your API key

### 2. Add to Environment Variables

Add to your `.env.local` file:

```bash
ARCJET_KEY=ajkey_test_your_actual_key_here
```

**Important:**
- Development keys start with `ajkey_test_`
- Production keys start with `ajkey_live_`

### 3. Restart Your Development Server

```bash
npm run dev
```

---

## 🛡️ Protection Details

### Authentication Routes (`/api/auth/[...all]`)

**Sign-Up Protection** (`/sign-up/email`):
- **Rate Limit:** 10 attempts per 10 minutes
- **Email Validation:** Blocks disposable, invalid, and no-MX emails
- **Bot Detection:** Enabled

**Sign-In Protection** (`/sign-in/email`):
- **Rate Limit:** 10 attempts per 10 minutes
- **Bot Detection:** Enabled

**Other Auth Routes:**
- **Rate Limit:** 60 requests per minute
- **Bot Detection:** Enabled

### Employee API Routes (`/api/employees`)

**All Endpoints:**
- **Rate Limit:** 100 requests per minute
- **Bot Detection:** Enabled
- **Shield (WAF):** Active

---

## 📊 Rate Limit Configuration

### Restrictive (Auth Endpoints)
```typescript
{
  max: 10,           // 10 requests
  interval: '10m'    // per 10 minutes
}
```

### Lax (General Endpoints)
```typescript
{
  max: 60,           // 60 requests
  interval: '1m'     // per 1 minute
}
```

### API (Employee Routes)
```typescript
{
  max: 100,          // 100 requests
  interval: '1m'     // per 1 minute
}
```

---

## 🧪 Testing Arcjet Protection

### Test Rate Limiting

1. Try logging in with wrong credentials 10 times in 10 minutes
2. On the 11th attempt, you should see:
   ```json
   {
     "error": "Too many requests. Please try again later."
   }
   ```

### Test Email Validation

1. Try signing up with a disposable email (e.g., `test@tempmail.com`)
2. You should see:
   ```json
   {
     "error": "Disposable email addresses are not allowed."
   }
   ```

### Test Invalid Email

1. Try signing up with an invalid email (e.g., `notanemail`)
2. You should see:
   ```json
   {
     "error": "Email address format is invalid."
   }
   ```

---

## 🔍 Monitoring

### Arcjet Dashboard

1. Go to [app.arcjet.com](https://app.arcjet.com)
2. View real-time analytics:
   - Request volume
   - Blocked requests
   - Rate limit violations
   - Bot detection results

---

## ⚙️ Customization

### Changing Rate Limits

Edit `app/api/auth/[...all]/route.ts`:

```typescript
const restrictiveRateLimitSettings = {
  mode: 'LIVE',
  max: 20,              // Change this
  interval: '15m',      // Change this
} satisfies SlidingWindowRateLimitOptions<[]>;
```

### Changing Email Validation Rules

Edit `app/api/auth/[...all]/route.ts`:

```typescript
const emailSettings = {
  mode: 'LIVE',
  block: [
    'DISPOSABLE',       // Block temporary emails
    'INVALID',          // Block malformed emails
    'NO_MX_RECORDS',    // Block emails with no mail server
    // Add more: 'NO_GRAVATAR', 'FREE_PROVIDER', etc.
  ],
} satisfies EmailOptions;
```

### Testing Mode

Change `mode: 'LIVE'` to `mode: 'DRY_RUN'` to log violations without blocking:

```typescript
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['userIdOrIp'],
  rules: [shield({ mode: 'DRY_RUN' })],  // Change to DRY_RUN
});
```

---

## 🌍 Production Deployment

### Before Going Live:

1. **Get Production API Key:**
   - Go to Arcjet dashboard
   - Create a production key (`ajkey_live_...`)
   - Add to production environment variables

2. **Verify All Modes are LIVE:**
   ```typescript
   mode: 'LIVE'  // ✅ Not 'DRY_RUN'
   ```

3. **Monitor Dashboard:**
   - Watch for legitimate users being blocked
   - Adjust rate limits if needed

---

## 🆓 Free Tier Limits

**Arcjet Free Plan:**
- ✅ 5,000 requests per month
- ✅ All security features included
- ✅ Real-time dashboard
- ✅ No credit card required

**What counts as a request:**
- Each API call to a protected route
- Each auth attempt (login, signup)

---

## 🚨 Troubleshooting

### "Too many requests" error in development

**Solution 1:** Switch to dry-run mode during development:
```typescript
mode: 'DRY_RUN'
```

**Solution 2:** Use a test API key that resets limits more frequently

### Arcjet blocks legitimate users

1. Check the dashboard for false positives
2. Adjust rate limits:
   ```typescript
   max: 20,  // Increase from 10
   ```
3. Whitelist specific IPs (contact Arcjet support)

### Environment variable not found

Make sure `.env.local` has:
```bash
ARCJET_KEY=ajkey_test_...
```

And restart your dev server.

---

## 📚 Additional Resources

- **Arcjet Docs:** https://docs.arcjet.com
- **Arcjet Dashboard:** https://app.arcjet.com
- **Arcjet Support:** https://discord.gg/arcjet

---

## ✅ Implementation Checklist

- [x] Arcjet package installed
- [x] API key added to environment
- [x] Auth routes protected
- [x] Employee API routes protected
- [x] Rate limiting configured
- [x] Email validation enabled
- [x] Bot detection enabled
- [x] Shield (WAF) enabled
- [ ] Tested in development
- [ ] Production key configured
- [ ] Dashboard monitoring setup

---

**Your application is now protected with enterprise-grade security! 🎉**
