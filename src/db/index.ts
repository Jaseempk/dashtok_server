import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/config/env';
import * as schema from './schema';

// Connection pool for queries
const client = postgres(env.DATABASE_URL, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
