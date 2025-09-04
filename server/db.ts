import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// تعطيل قاعدة البيانات مؤقتاً - سنستخدم Memory Storage
if (!process.env.DATABASE_URL) {
  console.log("⚠️ DATABASE_URL missing - using Memory Storage");
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });