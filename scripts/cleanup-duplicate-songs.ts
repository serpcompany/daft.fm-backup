#!/usr/bin/env tsx
// Clean up duplicate songs and keep only canonical versions
// Run with: pnpm tsx scripts/cleanup-duplicate-songs.ts

import Database from 'better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');

console.log('🧹 Starting duplicate songs cleanup...\n');

try {
  // Start a transaction
  sqlite.exec('BEGIN TRANSACTION');

  // Step 1: Find albums with too many tracks
  const problematicAlbums = sqlite.prepare(`
    SELECT 
      al.id,
      al.title as album_title,
      ar.name as artist_name,
      al.track_count as expected_tracks,
      COUNT(s.id) as actual_tracks
    FROM albums al
    JOIN artists ar ON al.artist_id = ar.id
    LEFT JOIN songs s ON al.id = s.album_id
    GROUP BY al.id
    HAVING COUNT(s.id) > al.track_count OR COUNT(s.id) > 20
    ORDER BY COUNT(s.id) DESC
  `).all() as any[];

  console.log(`Found ${problematicAlbums.length} albums with potential duplicate tracks\n`);

  let totalDeleted = 0;

  for (const album of problematicAlbums) {
    console.log(`\n📀 ${album.artist_name} - ${album.album_title}`);
    console.log(`   Expected: ${album.expected_tracks || '?'} tracks, Found: ${album.actual_tracks} tracks`);

    // Get all songs for this album
    const songs = sqlite.prepare(`
      SELECT id, title, musicbrainz_id
      FROM songs
      WHERE album_id = ?
      ORDER BY title
    `).all(album.id) as any[];

    // Group songs by base title (remove remix/live/version indicators)
    const songGroups = new Map<string, any[]>();
    
    for (const song of songs) {
      // Extract base title by removing common version indicators
      const baseTitle = song.title
        .replace(/\s*\([^)]*(?:mix|version|live|acoustic|demo|instrumental|radio|single|edit|remix|vocal)\)/gi, '')
        .replace(/\s*\[[^\]]*(?:mix|version|live|acoustic|demo|instrumental|radio|single|edit|remix|vocal)\]/gi, '')
        .trim();
      
      if (!songGroups.has(baseTitle)) {
        songGroups.set(baseTitle, []);
      }
      songGroups.get(baseTitle)!.push(song);
    }

    // Keep only the canonical version of each song
    const songsToDelete: number[] = [];
    
    for (const [baseTitle, versions] of songGroups) {
      if (versions.length > 1) {
        console.log(`   🎵 "${baseTitle}" has ${versions.length} versions`);
        
        // Sort to prioritize: no parentheses/brackets > shorter title > first alphabetically
        versions.sort((a, b) => {
          const aHasVersion = /\(|\[/.test(a.title);
          const bHasVersion = /\(|\[/.test(b.title);
          
          if (aHasVersion !== bHasVersion) {
            return aHasVersion ? 1 : -1;
          }
          
          if (a.title.length !== b.title.length) {
            return a.title.length - b.title.length;
          }
          
          return a.title.localeCompare(b.title);
        });
        
        // Keep the first one (canonical), delete the rest
        const canonical = versions[0];
        console.log(`      ✓ Keeping: "${canonical.title}"`);
        
        for (let i = 1; i < versions.length; i++) {
          console.log(`      ✗ Deleting: "${versions[i].title}"`);
          songsToDelete.push(versions[i].id);
        }
      }
    }

    // Delete duplicate songs
    if (songsToDelete.length > 0) {
      const deleteStmt = sqlite.prepare('DELETE FROM songs WHERE id = ?');
      for (const id of songsToDelete) {
        deleteStmt.run(id);
      }
      totalDeleted += songsToDelete.length;
      console.log(`   Deleted ${songsToDelete.length} duplicate tracks`);
    }

    // Update the album's track count to reflect actual tracks
    const remainingTracks = songs.length - songsToDelete.length;
    sqlite.prepare('UPDATE albums SET track_count = ? WHERE id = ?').run(remainingTracks, album.id);
  }

  // Commit the transaction
  sqlite.exec('COMMIT');
  
  console.log(`\n✨ Cleanup completed! Deleted ${totalDeleted} duplicate songs.`);
  
  // Show updated statistics
  const stats = sqlite.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM artists) as artists,
      (SELECT COUNT(*) FROM albums) as albums,
      (SELECT COUNT(*) FROM songs) as songs
  `).get() as any;
  
  console.log('\n📊 Updated database statistics:');
  console.log(`  Artists: ${stats.artists}`);
  console.log(`  Albums: ${stats.albums}`);
  console.log(`  Songs: ${stats.songs}`);

} catch (error) {
  console.error('❌ Cleanup failed:', error);
  sqlite.exec('ROLLBACK');
  process.exit(1);
} finally {
  sqlite.close();
}