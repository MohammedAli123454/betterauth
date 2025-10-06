# Better Auth with Next.js, Drizzle ORM & PostgreSQL

A complete authentication setup using Better Auth, Drizzle ORM, and PostgreSQL.

## Features

- ✅ Email/Password authentication
- ✅ GitHub OAuth (optional)
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Protected dashboard route
- ✅ Session management

## Setup Instructions

### 1. Install Dependencies

The main dependencies have been installed. To complete the installation:

```bash
npm install better-auth drizzle-orm postgres
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Update the values in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-long"
GITHUB_CLIENT_ID="your-github-client-id"  # optional
GITHUB_CLIENT_SECRET="your-github-client-secret"  # optional
```

### 3. Set Up PostgreSQL Database

Make sure you have PostgreSQL running locally or use a hosted service like:
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

### 4. Generate and Push Database Schema

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 5. Run the Development Server

```bash
npm run dev
```

### 6. Test the Application

Visit [http://localhost:3000/signin](http://localhost:3000/signin) to test authentication!

## Project Structure

```
betterauth/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts       # Auth API routes
│   ├── signin/
│   │   └── page.tsx              # Sign in page
│   └── dashboard/
│       └── page.tsx              # Protected dashboard
├── db/
│   ├── schema.ts                 # Database schema
│   └── index.ts                  # Database connection
├── lib/
│   ├── auth.ts                   # Better Auth config
│   └── auth-client.ts            # Client-side auth
├── drizzle.config.ts             # Drizzle configuration
└── .env.local                    # Environment variables
```

## Available Routes

- `/signin` - Sign in page
- `/dashboard` - Protected dashboard (requires authentication)
- `/api/auth/*` - Authentication API endpoints

## Database Schema

The app includes three tables:

- **user** - User accounts
- **session** - Active sessions
- **account** - OAuth accounts and credentials

## Next Steps

1. Add a sign-up page
2. Add password reset functionality
3. Add email verification
4. Customize the UI with Tailwind CSS or your preferred styling solution
5. Add more OAuth providers (Google, Discord, etc.)

## Troubleshooting

### Database Connection Issues

Make sure your `DATABASE_URL` is correct and PostgreSQL is running.

### Authentication Not Working

1. Verify `BETTER_AUTH_SECRET` is at least 32 characters
2. Check that `NEXT_PUBLIC_APP_URL` matches your development URL
3. Ensure database tables are created (run `npx drizzle-kit push`)

## Learn More

- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js Documentation](https://nextjs.org/docs)
