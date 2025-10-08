import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function addAuditLogTable() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon database...');

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('🔄 Creating audit_log table...');

  try {
    // Create audit_log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "action" text NOT NULL,
        "resource" text NOT NULL,
        "resourceId" text,
        "details" text,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "audit_log_userId_user_id_fk"
        FOREIGN KEY ("userId")
        REFERENCES "public"."user"("id")
        ON DELETE no action ON UPDATE no action
      );
    `);

    console.log('✅ Audit log table created!');

    // Create index for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "audit_log_userId_idx" ON "audit_log" ("userId");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "audit_log_resource_idx" ON "audit_log" ("resource");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "audit_log_createdAt_idx" ON "audit_log" ("createdAt" DESC);
    `);

    console.log('✅ Created indexes for audit log!');
    console.log('✅ All done! Audit log table is ready!');

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Audit log table already exists in database!');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  await client.end();
  process.exit(0);
}

addAuditLogTable();
