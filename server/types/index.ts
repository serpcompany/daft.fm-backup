// Generated types and Zod schemas from Drizzle schema
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { artists, albums, songs } from '../database/schema';

// Artist schemas
export const insertArtistSchema = createInsertSchema(artists);
export const selectArtistSchema = createSelectSchema(artists);
export const updateArtistSchema = createInsertSchema(artists).partial();

// Album schemas
export const insertAlbumSchema = createInsertSchema(albums);
export const selectAlbumSchema = createSelectSchema(albums);
export const updateAlbumSchema = createInsertSchema(albums).partial();

// Song schemas
export const insertSongSchema = createInsertSchema(songs);
export const selectSongSchema = createSelectSchema(songs);
export const updateSongSchema = createInsertSchema(songs).partial();

// TypeScript types (inferred from Zod schemas)
export type Artist = z.infer<typeof selectArtistSchema>;
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type UpdateArtist = z.infer<typeof updateArtistSchema>;

export type Album = z.infer<typeof selectAlbumSchema>;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type UpdateAlbum = z.infer<typeof updateAlbumSchema>;

export type Song = z.infer<typeof selectSongSchema>;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type UpdateSong = z.infer<typeof updateSongSchema>;

// Extended types with parsed JSON fields
export type ArtistWithParsedData = Omit<Artist, 'genres' | 'images' | 'externalIds'> & {
  genres?: string[];
  images?: string[];
  externalIds?: Record<string, string>;
};

export type AlbumWithParsedData = Omit<Album, 'coverArt' | 'externalIds'> & {
  coverArt?: string[];
  externalIds?: Record<string, string>;
};

export type SongWithParsedData = Omit<Song, 'externalIds'> & {
  externalIds?: Record<string, string>;
};