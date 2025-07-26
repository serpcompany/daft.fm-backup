// Drizzle ORM schema for Cloudflare D1 - Updated with proper entity resolution
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const artists = sqliteTable('artists', {
  // Our own primary key
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Core fields
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  urlSlug: text('url_slug').notNull().unique(),
  country: text('country'),
  formedYear: integer('formed_year'),
  genres: text('genres'), // JSON array
  members: text('members'), // JSON array
  bio: text('bio'),
  images: text('images'), // JSON array
  
  // Entity resolution identifiers
  musicbrainzId: text('musicbrainz_id').unique(),
  wikidataId: text('wikidata_id'),
  discogsArtistId: text('discogs_artist_id'),
  spotifyArtistId: text('spotify_artist_id'),
  lastfmUrl: text('lastfm_url'),
  isni: text('isni'),
  externalIds: text('external_ids'), // JSON object for any additional IDs
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const albums = sqliteTable('albums', {
  // Our own primary key
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Core fields
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  trackCount: integer('track_count'),
  genres: text('genres'), // JSON array
  coverArt: text('cover_art'), // JSON array
  credits: text('credits'), // JSON object
  
  // Entity resolution identifiers
  musicbrainzId: text('musicbrainz_id').unique(),
  wikidataId: text('wikidata_id'),
  discogsMasterId: text('discogs_master_id'),
  spotifyAlbumId: text('spotify_album_id'),
  barcode: text('barcode'),
  catalogNumber: text('catalog_number'),
  externalIds: text('external_ids'), // JSON object for any additional IDs
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const songs = sqliteTable('songs', {
  // Our own primary key
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Core fields
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  duration: integer('duration'), // seconds
  artistId: integer('artist_id').notNull().references(() => artists.id),
  albumId: integer('album_id').references(() => albums.id),
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  lyrics: text('lyrics'),
  annotations: text('annotations'),
  credits: text('credits'), // JSON object
  
  // Entity resolution identifiers
  musicbrainzId: text('musicbrainz_id').unique(),
  wikidataId: text('wikidata_id'),
  isrc: text('isrc'),
  spotifyTrackId: text('spotify_track_id'),
  geniusSongId: text('genius_song_id'),
  acoustid: text('acoustid'),
  externalIds: text('external_ids'), // JSON object for any additional IDs
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations remain the same
export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  songs: many(songs),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one }) => ({
  artist: one(artists, {
    fields: [songs.artistId],
    references: [artists.id],
  }),
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
}));