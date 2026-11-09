import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_V5RbxQ6qipkM@ep-blue-union-bdoeb2yb-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Using prepare: false is recommended for serverless/Next.js environments
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

