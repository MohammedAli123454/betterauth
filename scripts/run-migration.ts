import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL`);
    console.log('Added banned column');

    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "banReason" text`);
    console.log('Added banReason column');

    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "banExpires" timestamp`);
    console.log('Added banExpires column');

    console.log('Migration completed successfully!');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('Columns already exist, skipping migration');
    } else {
      console.error('Migration error:', error);
    }
  } finally {
    process.exit(0);
  }
}

runMigration();
