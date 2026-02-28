import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let db = null as ReturnType<typeof drizzle<typeof schema>> | null;

export function getDb() {
  if (db) return db;

  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  const client = postgres(env.DATABASE_URL);
  db = drizzle(client, { schema });

  return db;
}