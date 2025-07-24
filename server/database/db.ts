// Local SQLite database connection for development
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';

// Create database connection
const sqlite = new Database(path.join(process.cwd(), 'local.db'));
export const db = drizzle(sqlite, { schema });

// Run migrations on startup
export function runMigrations() {
  migrate(db, { migrationsFolder: './server/database/migrations' });
}

export default db;