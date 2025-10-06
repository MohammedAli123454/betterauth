import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin(email: string) {
  try {
    const updated = await db
      .update(user)
      .set({ role: 'admin', emailVerified: true })
      .where(eq(user.email, email))
      .returning();

    if (updated.length > 0) {
      console.log(`✅ ${email} is now an admin!`);
      console.log('User details:', updated[0]);
    } else {
      console.log(`❌ User with email ${email} not found`);
      console.log('Please sign up first at http://localhost:3000/login');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npm run make-admin your@email.com');
  process.exit(1);
}

makeAdmin(email);
