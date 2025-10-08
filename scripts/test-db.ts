import { db } from '../db';
import { session } from '../db/schema';

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Try to query the session table
    const sessions = await db.select().from(session).limit(5);

    console.log('✅ Database connection successful!');
    console.log(`Found ${sessions.length} sessions in database`);
    console.log('Sessions:', JSON.stringify(sessions, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

testDatabase();
