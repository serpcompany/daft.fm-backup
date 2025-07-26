// Database configuration for ETL pipeline
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../../server/database/schema';
import path from 'path';
import fs from 'fs';

// Database paths
const WRANGLER_DB_PATH = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite';
const STAGING_DB_PATH = 'data/staging.db';
const BACKUP_DIR = 'data/backups';

// Ensure data directories exist
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Database connection types
export type DatabaseConnection = {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzleSqlite>;
};

// Get production database (read-only by default)
export function getProductionDb(readonly = true): DatabaseConnection {
  const sqlite = new Database(WRANGLER_DB_PATH, {
    readonly,
    fileMustExist: true
  });
  const db = drizzleSqlite(sqlite, { schema });
  return { sqlite, db };
}

// Get staging database
export function getStagingDb(): DatabaseConnection {
  const sqlite = new Database(STAGING_DB_PATH);
  const db = drizzleSqlite(sqlite, { schema });
  return { sqlite, db };
}

// Copy schema from production to staging
export async function syncSchema() {
  console.log('🔄 Syncing schema from production to staging...');
  
  const prod = getProductionDb(true);
  const staging = getStagingDb();
  
  try {
    // Get schema from production
    const tables = prod.sqlite.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { sql: string }[];
    
    const indexes = prod.sqlite.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `).all() as { sql: string | null }[];
    
    // Drop all tables in staging
    const stagingTables = staging.sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];
    
    for (const table of stagingTables) {
      staging.sqlite.exec(`DROP TABLE IF EXISTS ${table.name}`);
    }
    
    // Create tables in staging
    for (const table of tables) {
      if (table.sql) {
        staging.sqlite.exec(table.sql);
      }
    }
    
    // Create indexes in staging
    for (const index of indexes) {
      if (index.sql) {
        staging.sqlite.exec(index.sql);
      }
    }
    
    console.log('✅ Schema synced successfully');
  } finally {
    prod.sqlite.close();
    staging.sqlite.close();
  }
}

// Backup production database
export async function backupProduction(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(BACKUP_DIR, `production-${timestamp}.db`);
  
  console.log(`📦 Backing up production database to ${backupPath}...`);
  
  const prod = getProductionDb(true);
  try {
    prod.sqlite.backup(backupPath);
    console.log('✅ Backup completed');
    return backupPath;
  } finally {
    prod.sqlite.close();
  }
}

// Validate staging data before promotion
export async function validateStagingData(): Promise<{ valid: boolean; errors: string[] }> {
  const staging = getStagingDb();
  const errors: string[] = [];
  
  try {
    // Check for orphaned records
    const orphanedAlbums = staging.sqlite.prepare(`
      SELECT COUNT(*) as count FROM albums 
      WHERE artist_id NOT IN (SELECT id FROM artists)
    `).get() as { count: number };
    
    if (orphanedAlbums.count > 0) {
      errors.push(`Found ${orphanedAlbums.count} orphaned albums`);
    }
    
    const orphanedSongs = staging.sqlite.prepare(`
      SELECT COUNT(*) as count FROM songs 
      WHERE artist_id NOT IN (SELECT id FROM artists)
      OR (album_id IS NOT NULL AND album_id NOT IN (SELECT id FROM albums))
    `).get() as { count: number };
    
    if (orphanedSongs.count > 0) {
      errors.push(`Found ${orphanedSongs.count} orphaned songs`);
    }
    
    // Check for duplicate musicbrainz IDs
    const duplicateArtists = staging.sqlite.prepare(`
      SELECT musicbrainz_id, COUNT(*) as count 
      FROM artists 
      WHERE musicbrainz_id IS NOT NULL 
      GROUP BY musicbrainz_id 
      HAVING count > 1
    `).all() as { musicbrainz_id: string; count: number }[];
    
    if (duplicateArtists.length > 0) {
      errors.push(`Found ${duplicateArtists.length} duplicate artist MusicBrainz IDs`);
    }
    
    return { valid: errors.length === 0, errors };
  } finally {
    staging.sqlite.close();
  }
}

// Promote staging to production
export async function promoteToProduction(force = false): Promise<boolean> {
  // Validate first
  if (!force) {
    const validation = await validateStagingData();
    if (!validation.valid) {
      console.error('❌ Validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      return false;
    }
  }
  
  // Backup production
  const backupPath = await backupProduction();
  console.log(`✅ Production backed up to: ${backupPath}`);
  
  // Copy staging to production
  console.log('🚀 Promoting staging to production...');
  
  const staging = getStagingDb();
  const prod = getProductionDb(false);
  
  try {
    // Clear production tables
    prod.sqlite.exec('DELETE FROM songs');
    prod.sqlite.exec('DELETE FROM albums');
    prod.sqlite.exec('DELETE FROM artists');
    
    // Copy data from staging
    const artists = staging.db.select().from(schema.artists).all();
    const albums = staging.db.select().from(schema.albums).all();
    const songs = staging.db.select().from(schema.songs).all();
    
    // Insert in batches
    const BATCH_SIZE = 100;
    
    // Insert artists
    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
      const batch = artists.slice(i, i + BATCH_SIZE);
      prod.db.insert(schema.artists).values(batch).run();
    }
    
    // Insert albums
    for (let i = 0; i < albums.length; i += BATCH_SIZE) {
      const batch = albums.slice(i, i + BATCH_SIZE);
      prod.db.insert(schema.albums).values(batch).run();
    }
    
    // Insert songs
    for (let i = 0; i < songs.length; i += BATCH_SIZE) {
      const batch = songs.slice(i, i + BATCH_SIZE);
      prod.db.insert(schema.songs).values(batch).run();
    }
    
    console.log('✅ Promotion completed successfully');
    console.log(`   - Artists: ${artists.length}`);
    console.log(`   - Albums: ${albums.length}`);
    console.log(`   - Songs: ${songs.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Promotion failed:', error);
    console.log('💡 You can restore from backup:', backupPath);
    return false;
  } finally {
    staging.sqlite.close();
    prod.sqlite.close();
  }
}

// Get database stats
export async function getDatabaseStats(db: DatabaseConnection) {
  const stats = db.sqlite.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM artists) as artists,
      (SELECT COUNT(*) FROM albums) as albums,
      (SELECT COUNT(*) FROM songs) as songs
  `).get() as { artists: number; albums: number; songs: number };
  
  return stats;
}