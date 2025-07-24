// URL generation and parsing utilities for daft.fm
import type { Artist, Album, Song } from '../types';

/**
 * Create clean URL slug - simple & predictable
 * 
 * The slug is cosmetic - the MBID is what really matters for uniqueness.
 * Goal: Create readable, URL-safe slugs without complex logic.
 * 
 * RULES:
 * 1. Convert to lowercase
 * 2. Keep only: letters (a-z), numbers (0-9), and spaces
 * 3. Convert spaces to hyphens
 * 4. Remove leading/trailing hyphens
 * 5. Limit to 50 characters
 * 6. If result is empty, use "item" as fallback
 */
export function createSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')             // Normalize unicode to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (ö → o)
    .replace(/[^a-z0-9\s]/g, '')  // Rule 2: Keep only letters, numbers, spaces
    .replace(/\s+/g, '-')         // Rule 3: Convert spaces to hyphens  
    .replace(/^-+|-+$/g, '')      // Rule 4: Remove leading/trailing hyphens
    .substring(0, 50);            // Rule 5: Limit length
  
  return slug || 'item';          // Rule 6: Fallback
}

/**
 * Generate URL for artist page
 * Format: /artists/[artist-slug]-[mbid]/
 */
export function generateArtistUrl(artist: Artist): string {
  const slug = createSlug(artist.name);
  return `/artists/${slug}-${artist.id}/`;
}

/**
 * Generate URL for album page  
 * Format: /albums/[artist-slug]-[album-slug]-[mbid]/
 */
export function generateAlbumUrl(album: Album, artist: Artist): string {
  const artistSlug = createSlug(artist.name);
  const albumSlug = createSlug(album.title);
  return `/albums/${artistSlug}-${albumSlug}-${album.id}/`;
}

/**
 * Generate URL for song page
 * Format: /songs/[artist-slug]-[song-slug]-[mbid]/
 */
export function generateSongUrl(song: Song, artist: Artist): string {
  const artistSlug = createSlug(artist.name);
  const songSlug = createSlug(song.title);
  return `/songs/${artistSlug}-${songSlug}-${song.id}/`;
}

/**
 * Parse MBID from URL slug
 * Extracts the UUID from the end of the slug
 */
export function parseMbidFromSlug(slug: string): string | null {
  // MusicBrainz IDs are UUIDs in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const mbidRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  const match = slug.match(mbidRegex);
  return match ? match[1] : null;
}

/**
 * Validate MusicBrainz ID format
 */
export function isValidMbid(mbid: string): boolean {
  // Temporarily allow test IDs with any alphanumeric characters
  const mbidRegex = /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i;
  return mbidRegex.test(mbid);
}

/**
 * Parse artist slug and extract MBID
 * Input: "daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56"
 * Output: { slug: "daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56", mbid: "056e4f3e-d505-4dad-8ec1-d04f521cbb56" }
 */
export function parseArtistSlug(slug: string): { slug: string; mbid: string } | null {
  const mbid = parseMbidFromSlug(slug);
  if (!mbid) return null;
  
  return {
    slug,
    mbid
  };
}

/**
 * Parse artist slug with short ID
 * Input: "daft-punk-056e4f3e" 
 * Output: { slug: "daft-punk-056e4f3e", shortId: "056e4f3e" }
 */
export function parseArtistSlugShort(slug: string): { slug: string; shortId: string } | null {
  // Split by dashes and check if last part looks like a short ID (8 hex chars)
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  if (lastPart && /^[a-f0-9]{8}$/i.test(lastPart)) {
    return {
      slug,
      shortId: lastPart
    };
  }
  
  return null;
}

/**
 * Parse album slug and extract MBID
 * Input: "daft-punk-discovery-47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c"
 * Output: { slug: "...", mbid: "47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c" }
 */
export function parseAlbumSlug(slug: string): { slug: string; mbid: string } | null {
  const mbid = parseMbidFromSlug(slug);
  if (!mbid) return null;
  
  return {
    slug,
    mbid
  };
}

/**
 * Parse song slug and extract MBID
 * Input: "daft-punk-one-more-time-s1a2b3c4-d5e6-7890-1234-567890abcdef"
 * Output: { slug: "...", mbid: "s1a2b3c4-d5e6-7890-1234-567890abcdef" }
 */
export function parseSongSlug(slug: string): { slug: string; mbid: string } | null {
  const mbid = parseMbidFromSlug(slug);
  if (!mbid) return null;
  
  return {
    slug,
    mbid
  };
}

/**
 * Generate breadcrumb data for navigation
 */
export function generateBreadcrumbs(type: 'artist' | 'album' | 'song', artist: Artist, album?: Album, song?: Song) {
  const breadcrumbs = [
    { name: 'Home', url: '/' }
  ];
  
  if (type === 'artist') {
    breadcrumbs.push(
      { name: 'Artists', url: '/artists/' },
      { name: artist.name, url: generateArtistUrl(artist) }
    );
  } else if (type === 'album' && album) {
    breadcrumbs.push(
      { name: 'Artists', url: '/artists/' },
      { name: artist.name, url: generateArtistUrl(artist) },
      { name: 'Albums', url: '/albums/' },
      { name: album.title, url: generateAlbumUrl(album, artist) }
    );
  } else if (type === 'song' && song) {
    breadcrumbs.push(
      { name: 'Artists', url: '/artists/' },
      { name: artist.name, url: generateArtistUrl(artist) },
      { name: 'Songs', url: '/songs/' },
      { name: song.title, url: generateSongUrl(song, artist) }
    );
  }
  
  return breadcrumbs;
}