-- Migration to add proper entity resolution fields and fix primary keys
-- WARNING: This is a breaking change that requires data migration

-- Step 1: Create new tables with proper structure
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
  artist_id INTEGER NOT NULL REFERENCES artists_new(id),
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
  artist_id INTEGER NOT NULL REFERENCES artists_new(id),
  album_id INTEGER REFERENCES albums_new(id),
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

-- Step 2: Create indexes for common lookups
CREATE INDEX idx_artists_musicbrainz ON artists_new(musicbrainz_id);
CREATE INDEX idx_artists_spotify ON artists_new(spotify_artist_id);
CREATE INDEX idx_artists_discogs ON artists_new(discogs_artist_id);

CREATE INDEX idx_albums_musicbrainz ON albums_new(musicbrainz_id);
CREATE INDEX idx_albums_artist ON albums_new(artist_id);
CREATE INDEX idx_albums_spotify ON albums_new(spotify_album_id);
CREATE INDEX idx_albums_barcode ON albums_new(barcode);

CREATE INDEX idx_songs_musicbrainz ON songs_new(musicbrainz_id);
CREATE INDEX idx_songs_artist ON songs_new(artist_id);
CREATE INDEX idx_songs_album ON songs_new(album_id);
CREATE INDEX idx_songs_isrc ON songs_new(isrc);
CREATE INDEX idx_songs_spotify ON songs_new(spotify_track_id);

-- Step 3: Migrate data (this will need to be done carefully)
-- Note: This is a template - you'll need to run a script to properly map the foreign keys
/*
INSERT INTO artists_new (
  name, slug, url_slug, country, formed_year, genres, members, bio, images,
  musicbrainz_id, wikidata_id, external_ids, created_at, updated_at
)
SELECT 
  name, slug, url_slug, country, formed_year, genres, members, bio, images,
  id as musicbrainz_id, wikidata_id, external_ids, created_at, updated_at
FROM artists;

-- Similar for albums and songs, but need to map artist_id and album_id
*/

-- Step 4: Drop old tables and rename new ones
-- DROP TABLE songs;
-- DROP TABLE albums;
-- DROP TABLE artists;
-- ALTER TABLE artists_new RENAME TO artists;
-- ALTER TABLE albums_new RENAME TO albums;
-- ALTER TABLE songs_new RENAME TO songs;