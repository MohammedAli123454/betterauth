import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to reuse connection
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __client: ReturnType<typeof postgres> | undefined;
}

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  if (!global.__client) {
    global.__client = postgres(connectionString, { prepare: false });
  }
  client = global.__client;

  if (!global.__db) {
    global.__db = drizzle(client, { schema });
  }
  db = global.__db;
}

export { db };
