# 📊 Rate Limiting Configuration Guide

## Current Rate Limits

### **Employee API** (`/api/employees`)

| Action | Limit | Interval | Error Message |
|--------|-------|----------|---------------|
| **GET** (List employees) | 100 requests | per minute | "Too many requests. Please slow down." |
| **POST** (Create employee) | 10 creations | per 24 hours | "Daily limit reached. You can only create 10 employees per day." |

### **Authentication** (`/api/auth/[...all]`)

| Action | Limit | Interval | Error Message |
|--------|-------|----------|---------------|
| **Sign Up** | 10 attempts | per 10 minutes | "Too many requests. Please try again later." |
| **Sign In** | 10 attempts | per 10 minutes | "Too many requests. Please try again later." |
| **Other Auth** | 60 requests | per minute | "Too many requests. Please try again later." |

---

## How to Customize Rate Limits

### Employee Creation Limit (Per Day)

Edit: `app/api/employees/route.ts`

```typescript
// Line 61: Change max from 10 to your desired number
max: 10, // Only 10 employee creations per day

// Examples:
max: 5,   // 5 employees per day
max: 20,  // 20 employees per day
max: 50,  // 50 employees per day
```

### Employee Creation Interval

```typescript
// Line 62: Change interval
interval: '24h',

// Available intervals:
interval: '1h',   // Per hour
interval: '12h',  // Per 12 hours
interval: '24h',  // Per day (current)
interval: '1w',   // Per week
```

### Employee Reading Limit

```typescript
// Line 30: Change max
max: 100, // 100 reads per minute

// Line 31: Change interval
interval: '1m',

// Examples:
max: 50, interval: '1m'    // 50 per minute
max: 500, interval: '5m'   // 500 per 5 minutes
max: 1000, interval: '1h'  // 1000 per hour
```

---

## Different Limits for Different Users

You can set different limits based on user roles:

```typescript
async function protectPostRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user.id || findIp(request) || '127.0.0.1';
  const userRole = session?.user.role;

  // Different limits based on role
  let maxCreations = 10; // Default for super_user

  if (userRole === 'admin') {
    maxCreations = 50; // Admins get 50 per day
  } else if (userRole === 'super_user') {
    maxCreations = 20; // Super users get 20 per day
  }

  const decision = await aj
    .withRule(
      slidingWindow({
        mode: 'LIVE',
        max: maxCreations,
        interval: '24h',
      })
    )
    .protect(request, { userId });

  // ... rest of the code
}
```

---

## Testing Rate Limits

### Test Employee Creation Limit

1. Try creating 10 employees quickly
2. On the 11th attempt, you should see:
   ```json
   {
     "success": false,
     "error": "Daily limit reached. You can only create 10 employees per day."
   }
   ```

### Test in Development (Bypass Limits)

Temporarily change mode to `DRY_RUN`:

```typescript
const decision = await aj
  .withRule(
    slidingWindow({
      mode: 'DRY_RUN', // Won't actually block
      max: 10,
      interval: '24h',
    })
  )
  .protect(request, { userId });
```

---

## Available Interval Options

| Interval | Description | Example Use Case |
|----------|-------------|------------------|
| `10s` | 10 seconds | Very restrictive |
| `1m` | 1 minute | Reading data |
| `5m` | 5 minutes | Moderate operations |
| `10m` | 10 minutes | Login attempts |
| `1h` | 1 hour | API operations |
| `12h` | 12 hours | Daily-ish operations |
| `24h` | 24 hours | Daily limits |
| `1w` | 1 week | Weekly limits |

---

## Tracking Methods

### By User ID (Current)
```typescript
characteristics: ['userId']
```
- ✅ Tracks authenticated users accurately
- ✅ Can't be bypassed by changing IP
- ❌ Doesn't work for unauthenticated requests

### By IP Address
```typescript
characteristics: ['ip']
```
- ✅ Works for unauthenticated users
- ❌ Can be bypassed with VPN/proxy

### By User ID or IP (Flexible)
```typescript
characteristics: ['userIdOrIp']
```
- ✅ Best of both worlds
- ✅ Falls back to IP if not authenticated

---

## Common Configurations

### Strict (High Security)
```typescript
max: 5,
interval: '24h'
// Only 5 creations per day
```

### Moderate (Balanced)
```typescript
max: 20,
interval: '24h'
// 20 creations per day (current with customization)
```

### Generous (Development)
```typescript
max: 100,
interval: '24h'
// 100 creations per day
```

### Per Hour Instead of Per Day
```typescript
max: 5,
interval: '1h'
// 5 creations per hour (120 per day max)
```

---

## Monitoring

### Arcjet Dashboard

1. Go to [app.arcjet.com](https://app.arcjet.com)
2. View real-time analytics:
   - How many users hit limits
   - Most active users
   - Which endpoints are being rate limited

### Check User's Current Usage

Add this endpoint to see a user's rate limit status:

```typescript
// app/api/employees/usage/route.ts
export async function GET(request: NextRequest) {
  // This shows remaining requests in Arcjet dashboard
  // No code needed - check Arcjet dashboard for per-user stats
}
```

---

## Recommended Limits by Use Case

### Small Team (< 10 people)
```typescript
GET: max: 100, interval: '1m'
POST: max: 10, interval: '24h'
```

### Medium Team (10-50 people)
```typescript
GET: max: 200, interval: '1m'
POST: max: 25, interval: '24h'
```

### Large Organization (50+ people)
```typescript
GET: max: 500, interval: '1m'
POST: max: 50, interval: '24h'
```

### Development/Testing
```typescript
mode: 'DRY_RUN' // Logs but doesn't block
```

---

## Bypassing Limits for Specific Users

### Whitelist Admin Users

```typescript
async function protectPostRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userRole = session?.user.role;

  // Admins have no limits
  if (userRole === 'admin') {
    return null; // Skip rate limiting
  }

  // Apply limits to other users
  const userId = session?.user.id || findIp(request) || '127.0.0.1';
  const decision = await aj
    .withRule(
      slidingWindow({
        mode: 'LIVE',
        max: 10,
        interval: '24h',
      })
    )
    .protect(request, { userId });

  // ... rest of code
}
```

---

## 🚨 Important Notes

1. **Free Tier Limit**: Arcjet free tier = 5,000 requests/month
   - Each rate limit check = 1 request
   - Monitor your usage in Arcjet dashboard

2. **Reset Time**: Sliding windows reset gradually
   - Not all at once at midnight
   - Example: If you hit limit at 2pm, you can create more at 2pm next day

3. **Production**: Always use `mode: 'LIVE'` in production

4. **Testing**: Use `mode: 'DRY_RUN'` for testing

---

## Quick Reference

**Current Settings:**
- ✅ Employees: 10 creations per 24 hours
- ✅ Employee reads: 100 per minute
- ✅ Login attempts: 10 per 10 minutes
- ✅ Tracked by: User ID

**To Change:**
1. Edit `app/api/employees/route.ts`
2. Modify the `max` and `interval` values
3. Restart dev server
4. Test the new limits

---

**Your rate limiting is now configured to allow 10 employee creations per day per user! 🎉**
