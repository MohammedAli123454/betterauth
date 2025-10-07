import { db } from '../db';
import { user, account } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Better Auth uses bcrypt internally, but we need to use their format
// This uses Node's built-in crypto for compatibility
async function hashPassword(password: string): Promise<string> {
  // Better Auth expects bcrypt hash format
  // We'll use a simple approach that works with Better Auth
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

async function makeAdmin(email: string) {
  try {
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (existing.length === 0) {
      const name = process.argv[3];
      const password = process.argv[4];

      if (!name || !password) {
        console.log(`❌ User with email ${email} not found`);
        console.log(
          `Provide a display name and password to create the first admin, e.g.:
  npm run make-admin admin@example.com "Admin User" "Str0ngPass!"`
        );
        process.exit(1);
      }

      if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters');
        process.exit(1);
      }

      const hashedPassword = await hashPassword(password);
      const now = new Date();
      const userId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        // Create user
        await tx.insert(user).values({
          id: userId,
          email,
          name,
          role: 'admin',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        });

        // Create account with password
        await tx.insert(account).values({
          id: crypto.randomUUID(),
          accountId: email, // Better Auth uses email as accountId for credentials
          providerId: 'credential',
          userId,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        });
      });

      console.log(`✅ Created admin user ${email}`);
      console.log(`You can now sign in with:`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      process.exit(0);
    }

    if (existing[0].role === 'admin') {
      console.log(`ℹ️  ${email} is already an admin.`);
      process.exit(0);
    }

    const [updated] = await db
      .update(user)
      .set({ role: 'admin', emailVerified: true, updatedAt: new Date() })
      .where(eq(user.id, existing[0].id))
      .returning();

    if (updated) {
      console.log(`✅ ${email} is now an admin!`);
    } else {
      console.log('❌ Unable to update user role');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npm run make-admin user@email.com [name] [password]');
  process.exit(1);
}

makeAdmin(email);
