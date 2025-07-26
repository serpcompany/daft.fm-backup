#!/usr/bin/env tsx
// Script to migrate from MusicBrainz IDs as primary keys to auto-increment IDs
// Run with: pnpm tsx scripts/migrate-to-entity-resolution.ts

import Database from 'better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');

console.log('🔄 Starting entity resolution migration...\n');

try {
  // Start a transaction
  sqlite.exec('BEGIN TRANSACTION');

  // Step 1: Create new tables with proper structure
  console.log('1️⃣ Creating new tables with auto-increment IDs...');
  
  sqlite.exec(`
    CREATE TABLE artists_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      url_slug TEXT NOT NULL UNIQUE,
      country TEXT,
      formed_year INTEGER,
      genres TEXT,
      members TEXT,
      bio TEXT,
      images TEXT,
      
      -- Entity resolution identifiers
      musicbrainz_id TEXT UNIQUE,
      wikidata_id TEXT,
      discogs_artist_id TEXT,
      spotify_artist_id TEXT,
      lastfm_url TEXT,
      isni TEXT,
      external_ids TEXT,
      
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE albums_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      artist_id INTEGER NOT NULL,
      release_date INTEGER,
      track_count INTEGER,
      genres TEXT,
      cover_art TEXT,
      credits TEXT,
      
      -- Entity resolution identifiers
      musicbrainz_id TEXT UNIQUE,
      wikidata_id TEXT,
      discogs_master_id TEXT,
      spotify_album_id TEXT,
      barcode TEXT,
      catalog_number TEXT,
      external_ids TEXT,
      
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE songs_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      duration INTEGER,
      artist_id INTEGER NOT NULL,
      album_id INTEGER,
      release_date INTEGER,
      lyrics TEXT,
      annotations TEXT,
      credits TEXT,
      
      -- Entity resolution identifiers
      musicbrainz_id TEXT UNIQUE,
      wikidata_id TEXT,
      isrc TEXT,
      spotify_track_id TEXT,
      genius_song_id TEXT,
      acoustid TEXT,
      external_ids TEXT,
      
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Step 2: Migrate artists data
  console.log('2️⃣ Migrating artists...');
  
  sqlite.exec(`
    INSERT INTO artists_new (
      name, slug, url_slug, country, formed_year, genres, members, bio, images,
      musicbrainz_id, wikidata_id, external_ids, created_at, updated_at
    )
    SELECT 
      name, slug, url_slug, country, formed_year, genres, members, bio, images,
      id as musicbrainz_id, wikidata_id, external_ids, created_at, updated_at
    FROM artists;
  `);

  const artistIdMap = sqlite.prepare(`
    SELECT a.id as old_id, an.id as new_id 
    FROM artists a 
    JOIN artists_new an ON a.id = an.musicbrainz_id
  `).all() as Array<{old_id: string, new_id: number}>;

  console.log(`✅ Migrated ${artistIdMap.length} artists`);

  // Step 3: Migrate albums with new artist IDs
  console.log('3️⃣ Migrating albums...');
  
  // Create a mapping for faster lookups
  const artistMap = new Map(artistIdMap.map(row => [row.old_id, row.new_id]));
  
  const albums = sqlite.prepare('SELECT * FROM albums').all() as any[];
  const insertAlbum = sqlite.prepare(`
    INSERT INTO albums_new (
      title, slug, artist_id, release_date, track_count, genres, cover_art, credits,
      musicbrainz_id, wikidata_id, external_ids, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const album of albums) {
    const newArtistId = artistMap.get(album.artist_id);
    if (!newArtistId) {
      console.warn(`⚠️  Could not find artist mapping for album ${album.title}`);
      continue;
    }
    
    insertAlbum.run(
      album.title, album.slug, newArtistId, album.release_date, album.track_count,
      album.genres, album.cover_art, album.credits,
      album.id, album.wikidata_id, album.external_ids, album.created_at, album.updated_at
    );
  }

  const albumIdMap = sqlite.prepare(`
    SELECT a.id as old_id, an.id as new_id 
    FROM albums a 
    JOIN albums_new an ON a.id = an.musicbrainz_id
  `).all() as Array<{old_id: string, new_id: number}>;

  console.log(`✅ Migrated ${albumIdMap.length} albums`);

  // Step 4: Migrate songs with new artist and album IDs
  console.log('4️⃣ Migrating songs...');
  
  const albumMap = new Map(albumIdMap.map(row => [row.old_id, row.new_id]));
  const songs = sqlite.prepare('SELECT * FROM songs').all() as any[];
  const insertSong = sqlite.prepare(`
    INSERT INTO songs_new (
      title, slug, duration, artist_id, album_id, release_date, lyrics, annotations, credits,
      musicbrainz_id, wikidata_id, isrc, external_ids, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const song of songs) {
    const newArtistId = artistMap.get(song.artist_id);
    if (!newArtistId) {
      console.warn(`⚠️  Could not find artist mapping for song ${song.title}`);
      continue;
    }
    
    const newAlbumId = song.album_id ? albumMap.get(song.album_id) : null;
    
    insertSong.run(
      song.title, song.slug, song.duration, newArtistId, newAlbumId,
      song.release_date, song.lyrics, song.annotations, song.credits,
      song.id, song.wikidata_id, song.isrc, song.external_ids,
      song.created_at, song.updated_at
    );
  }

  const songCount = sqlite.prepare('SELECT COUNT(*) as count FROM songs_new').get() as any;
  console.log(`✅ Migrated ${songCount.count} songs`);

  // Step 5: Create indexes
  console.log('5️⃣ Creating indexes...');
  
  sqlite.exec(`
    -- Artist indexes
    CREATE INDEX idx_artists_musicbrainz ON artists_new(musicbrainz_id);
    CREATE INDEX idx_artists_spotify ON artists_new(spotify_artist_id);
    CREATE INDEX idx_artists_discogs ON artists_new(discogs_artist_id);

    -- Album indexes  
    CREATE INDEX idx_albums_musicbrainz ON albums_new(musicbrainz_id);
    CREATE INDEX idx_albums_artist ON albums_new(artist_id);
    CREATE INDEX idx_albums_spotify ON albums_new(spotify_album_id);
    CREATE INDEX idx_albums_barcode ON albums_new(barcode);

    -- Song indexes
    CREATE INDEX idx_songs_musicbrainz ON songs_new(musicbrainz_id);
    CREATE INDEX idx_songs_artist ON songs_new(artist_id);
    CREATE INDEX idx_songs_album ON songs_new(album_id);
    CREATE INDEX idx_songs_isrc ON songs_new(isrc);
    CREATE INDEX idx_songs_spotify ON songs_new(spotify_track_id);
  `);

  // Step 6: Swap tables
  console.log('6️⃣ Swapping tables...');
  
  sqlite.exec(`
    DROP TABLE songs;
    DROP TABLE albums;
    DROP TABLE artists;
    
    ALTER TABLE artists_new RENAME TO artists;
    ALTER TABLE albums_new RENAME TO albums;
    ALTER TABLE songs_new RENAME TO songs;
  `);

  // Commit the transaction
  sqlite.exec('COMMIT');
  
  console.log('\n✨ Migration completed successfully!');
  
  // Show summary
  const summary = sqlite.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM artists) as artists,
      (SELECT COUNT(*) FROM albums) as albums,
      (SELECT COUNT(*) FROM songs) as songs
  `).get() as any;
  
  console.log('\n📊 Final counts:');
  console.log(`  Artists: ${summary.artists}`);
  console.log(`  Albums: ${summary.albums}`);
  console.log(`  Songs: ${summary.songs}`);

} catch (error) {
  console.error('❌ Migration failed:', error);
  sqlite.exec('ROLLBACK');
  process.exit(1);
} finally {
  sqlite.close();
}