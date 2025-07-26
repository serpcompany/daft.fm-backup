#!/usr/bin/env tsx
// Wipe the database clean
// Run with: pnpm tsx scripts/wipe-database.ts

import Database from 'better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');

console.log('🗑️  Wiping database clean...\n');

try {
  // Delete all data but keep the schema
  sqlite.exec('DELETE FROM songs');
  sqlite.exec('DELETE FROM albums');
  sqlite.exec('DELETE FROM artists');
  
  // Reset auto-increment counters
  sqlite.exec("DELETE FROM sqlite_sequence WHERE name IN ('songs', 'albums', 'artists')");
  
  console.log('✨ Database wiped clean!');
  
  // Verify
  const stats = sqlite.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM artists) as artists,
      (SELECT COUNT(*) FROM albums) as albums,
      (SELECT COUNT(*) FROM songs) as songs
  `).get() as any;
  
  console.log('\n📊 Database now contains:');
  console.log(`  Artists: ${stats.artists}`);
  console.log(`  Albums: ${stats.albums}`);
  console.log(`  Songs: ${stats.songs}`);

} catch (error) {
  console.error('❌ Failed to wipe database:', error);
  process.exit(1);
} finally {
  sqlite.close();
}