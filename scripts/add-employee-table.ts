import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function addEmployeeTable() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon database...');

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('🔄 Creating employee table...');

  try {
    // Create employee table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "employee" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "position" text NOT NULL,
        "department" text NOT NULL,
        "salary" numeric(10, 2) NOT NULL,
        "hireDate" timestamp NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        "createdBy" text,
        "updatedBy" text,
        CONSTRAINT "employee_email_unique" UNIQUE("email")
      );
    `);

    console.log('✅ Employee table created!');

    // Add foreign key constraints
    await db.execute(sql`
      ALTER TABLE "employee"
      ADD CONSTRAINT "employee_createdBy_user_id_fk"
      FOREIGN KEY ("createdBy")
      REFERENCES "public"."user"("id")
      ON DELETE no action ON UPDATE no action;
    `);

    console.log('✅ Added createdBy foreign key!');

    await db.execute(sql`
      ALTER TABLE "employee"
      ADD CONSTRAINT "employee_updatedBy_user_id_fk"
      FOREIGN KEY ("updatedBy")
      REFERENCES "public"."user"("id")
      ON DELETE no action ON UPDATE no action;
    `);

    console.log('✅ Added updatedBy foreign key!');
    console.log('✅ All done! Employee table is ready!');

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Employee table already exists in database!');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  await client.end();
  process.exit(0);
}

addEmployeeTable();
