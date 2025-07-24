// MusicBrainz API client with rate limiting
import { z } from 'zod';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'daft.fm/1.0.0 (https://daft.fm)';
const RATE_LIMIT_MS = 1000; // 1 request per second as per MusicBrainz guidelines

// Rate limiting
let lastRequestTime = 0;

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Zod schemas for MusicBrainz API responses
const MBArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  'sort-name': z.string(),
  disambiguation: z.string().optional(),
  country: z.string().nullish(),
  'life-span': z.object({
    begin: z.string().nullish(),
    end: z.string().nullish(),
    ended: z.boolean().nullish()
  }).optional(),
  relations: z.array(z.object({
    type: z.string(),
    direction: z.string(),
    url: z.object({
      resource: z.string()
    }).optional()
  })).optional(),
  tags: z.array(z.object({
    count: z.number(),
    name: z.string()
  })).optional()
});

const MBReleaseGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  'primary-type': z.string().optional(),
  'first-release-date': z.string().optional(),
  disambiguation: z.string().optional(),
  relations: z.array(z.any()).optional()
});

const MBRecordingSchema = z.object({
  id: z.string(),
  title: z.string(),
  length: z.number().nullish(),
  disambiguation: z.string().optional(),
  relations: z.array(z.any()).optional()
});

// Artist search and lookup
export async function searchArtists(query: string, limit = 25) {
  const url = `${MUSICBRAINZ_BASE_URL}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
  const data = await rateLimitedFetch(url);
  return z.object({ artists: z.array(MBArtistSchema) }).parse(data);
}

export async function getArtist(mbid: string, includes: string[] = []) {
  const includeStr = includes.length > 0 ? `&inc=${includes.join('+')}` : '';
  const url = `${MUSICBRAINZ_BASE_URL}/artist/${mbid}?fmt=json${includeStr}`;
  const data = await rateLimitedFetch(url);
  return MBArtistSchema.parse(data);
}

// Get artists by external relationship count (popularity proxy)
export async function getPopularArtists(limit = 50) {
  const url = `${MUSICBRAINZ_BASE_URL}/artist?query=*&fmt=json&limit=${limit}`;
  const data = await rateLimitedFetch(url);
  const result = z.object({ artists: z.array(MBArtistSchema) }).parse(data);
  
  // Sort by number of external relations as popularity proxy
  return result.artists.sort((a, b) => {
    const aRelCount = a.relations?.length || 0;
    const bRelCount = b.relations?.length || 0;
    return bRelCount - aRelCount;
  });
}

// Release group (album) lookup
export async function getArtistReleaseGroups(artistMbid: string, limit = 100) {
  const url = `${MUSICBRAINZ_BASE_URL}/release-group?artist=${artistMbid}&fmt=json&limit=${limit}`;
  const data = await rateLimitedFetch(url);
  return z.object({ 'release-groups': z.array(MBReleaseGroupSchema) }).parse(data);
}

export async function getReleaseGroup(mbid: string, includes: string[] = []) {
  const includeStr = includes.length > 0 ? `&inc=${includes.join('+')}` : '';
  const url = `${MUSICBRAINZ_BASE_URL}/release-group/${mbid}?fmt=json${includeStr}`;
  const data = await rateLimitedFetch(url);
  return MBReleaseGroupSchema.parse(data);
}

// Recording (song) lookup
export async function getArtistRecordings(artistMbid: string, limit = 100) {
  const url = `${MUSICBRAINZ_BASE_URL}/recording?artist=${artistMbid}&fmt=json&limit=${limit}`;
  const data = await rateLimitedFetch(url);
  return z.object({ recordings: z.array(MBRecordingSchema) }).parse(data);
}

export async function getRecording(mbid: string, includes: string[] = []) {
  const includeStr = includes.length > 0 ? `&inc=${includes.join('+')}` : '';
  const url = `${MUSICBRAINZ_BASE_URL}/recording/${mbid}?fmt=json${includeStr}`;
  const data = await rateLimitedFetch(url);
  return MBRecordingSchema.parse(data);
}

// Utility to create slug from name
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Types
export type MBArtist = z.infer<typeof MBArtistSchema>;
export type MBReleaseGroup = z.infer<typeof MBReleaseGroupSchema>;
export type MBRecording = z.infer<typeof MBRecordingSchema>;