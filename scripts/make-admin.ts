import { db } from '../db';
import { user, account } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';

// Hash password using scrypt (same as lib/auth.ts)
async function hashPassword(password: string): Promise<string> {
  const scryptAsync = promisify(crypto.scrypt);

  // Generate a 32-byte salt
  const salt = crypto.randomBytes(32);

  // Hash the password with scrypt (64-byte output)
  const derivedKey = (await scryptAsync(
    password.normalize('NFKC'),
    salt,
    64
  )) as Buffer;

  // Combine salt + hash and encode as base64
  const combined = Buffer.concat([salt, derivedKey]);
  return combined.toString('base64');
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
