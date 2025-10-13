import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Starting schema migration...\n');

    // Previous migrations (kept for reference)
    try {
      await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false NOT NULL`);
      console.log('✓ Added/verified banned column');
    } catch (error: any) {
      if (!error.message?.includes('already exists')) console.log('  (already exists)');
    }

    try {
      await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text`);
      console.log('✓ Added/verified banReason column');
    } catch (error: any) {
      if (!error.message?.includes('already exists')) console.log('  (already exists)');
    }

    try {
      await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp`);
      console.log('✓ Added/verified banExpires column');
    } catch (error: any) {
      if (!error.message?.includes('already exists')) console.log('  (already exists)');
    }

    console.log('\n--- New migrations for Better Auth compliance ---\n');

    // 1. Add new columns to account table
    try {
      await db.execute(sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp`);
      console.log('✓ Added refreshTokenExpiresAt to account table');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('  refreshTokenExpiresAt (already exists)');
      } else {
        throw error;
      }
    }

    try {
      await db.execute(sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text`);
      console.log('✓ Added scope to account table');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('  scope (already exists)');
      } else {
        throw error;
      }
    }

    // 2. Rename expiresAt to accessTokenExpiresAt in account table
    try {
      // Check if old column exists before renaming
      const checkColumn = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'account'
        AND column_name = 'expiresAt'
      `);

      if (checkColumn.rows && checkColumn.rows.length > 0) {
        await db.execute(sql`ALTER TABLE "account" RENAME COLUMN "expiresAt" TO "accessTokenExpiresAt"`);
        console.log('✓ Renamed expiresAt to accessTokenExpiresAt in account table');
      } else {
        console.log('  expiresAt column not found (may already be renamed)');
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('already exists')) {
        console.log('  Column already renamed or does not exist');
      } else {
        throw error;
      }
    }

    // 3. Add timestamps to verification table
    try {
      await db.execute(sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT NOW() NOT NULL`);
      console.log('✓ Added createdAt to verification table');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('  createdAt (already exists)');
      } else {
        throw error;
      }
    }

    try {
      await db.execute(sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT NOW() NOT NULL`);
      console.log('✓ Added updatedAt to verification table');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('  updatedAt (already exists)');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
