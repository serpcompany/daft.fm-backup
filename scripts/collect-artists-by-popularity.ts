#!/usr/bin/env tsx
// Collect top artists by popularity from MusicBrainz
// Following the agreed data collection workflow from IMPLEMENTATION-GUIDE.md
// Run with: pnpm tsx scripts/collect-artists-by-popularity.ts

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { artists, albums, songs } from '../server/database/schema';
import { createSlug } from '../server/lib/musicbrainz';

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'daft.fm/1.0.0 (https://daft.to)';
const RATE_LIMIT_MS = 1000; // 1 request per second

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

// Get artist with full relationship data
async function getArtistWithRelations(mbid: string): Promise<any> {
  try {
    const url = `${MUSICBRAINZ_BASE_URL}/artist/${mbid}?fmt=json&inc=url-rels+tags`;
    return await rateLimitedFetch(url);
  } catch (error) {
    console.error(`Error fetching artist ${mbid}:`, error);
    return null;
  }
}

// Step 1: Get Artists by Priority
// Since MusicBrainz doesn't have a direct popularity API, we'll search for
// well-known artists and sort by relationship count
async function getPopularArtists(limit: number = 100): Promise<any[]> {
  console.log('📊 Fetching popular artists with most relationships...\n');
  
  const allArtists: Map<string, any> = new Map(); // Use Map to avoid duplicates
  
  // Search for artists that are likely to be popular
  // Using different search strategies to find well-known artists
  const searchQueries = [
    // Search by tag (these return artists tagged with these genres)
    'tag:rock AND tag:pop',
    'tag:electronic AND tag:pop',
    'tag:hip-hop',
    'tag:jazz',
    'tag:classical',
    'tag:soul',
    'tag:metal',
    'tag:indie',
    // Search for artists with many recordings
    'recording_count:[100 TO *]',
    'release_count:[10 TO *]',
    // Search for artists from major music countries
    'country:US',
    'country:GB', 
    'country:CA',
    'country:AU',
    'country:FR',
    'country:DE',
    'country:JP',
  ];
  
  for (const query of searchQueries) {
    if (allArtists.size >= limit * 3) break; // Have enough candidates
    
    try {
      const url = `${MUSICBRAINZ_BASE_URL}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=100`;
      const data = await rateLimitedFetch(url);
      
      if (data.artists) {
        for (const artist of data.artists) {
          // Get full artist data with relationships
          if (!allArtists.has(artist.id)) {
            const fullArtist = await getArtistWithRelations(artist.id);
            if (fullArtist) {
              allArtists.set(artist.id, fullArtist);
              console.log(`  Found ${allArtists.size} unique artists...`);
            }
          }
          if (allArtists.size >= limit * 3) break;
        }
      }
    } catch (error) {
      console.error(`Error searching with query "${query}":`, error);
    }
  }
  
  // Convert Map to array and sort by relationship count
  const artistsArray = Array.from(allArtists.values());
  
  // Sort by relationship count (more relationships = more popular)
  const sortedArtists = artistsArray
    .filter(artist => {
      // Filter out special purpose artists
      const name = artist.name.toLowerCase();
      return !name.includes('various artists') && 
             !name.includes('[unknown]') &&
             !name.includes('traditional') &&
             artist.relations && artist.relations.length > 0;
    })
    .sort((a, b) => {
      const aRelCount = (a.relations?.length || 0) + (a.tags?.length || 0) * 2; // Tags worth more
      const bRelCount = (b.relations?.length || 0) + (b.tags?.length || 0) * 2;
      return bRelCount - aRelCount;
    })
    .slice(0, limit);
  
  console.log(`\n✅ Selected top ${sortedArtists.length} artists by popularity\n`);
  return sortedArtists;
}

// Step 2: For Each Artist: Get Albums (release groups)
async function getArtistAlbums(artistMbid: string): Promise<any[]> {
  const url = `${MUSICBRAINZ_BASE_URL}/release-group?artist=${artistMbid}&type=album&fmt=json&limit=100`;
  const data = await rateLimitedFetch(url);
  
  // Filter out compilations, live albums, etc.
  return (data['release-groups'] || []).filter((rg: any) => {
    const secondaryTypes = rg['secondary-types'] || [];
    const excludedTypes = ['Compilation', 'Live', 'Soundtrack', 'Remix', 'Demo', 'Mixtape'];
    return !secondaryTypes.some((type: string) => excludedTypes.includes(type));
  });
}

// Step 3: For Each Album: Get Canonical Release
async function getCanonicalRelease(releaseGroupMbid: string): Promise<any | null> {
  const url = `${MUSICBRAINZ_BASE_URL}/release-group/${releaseGroupMbid}?inc=releases&fmt=json`;
  const data = await rateLimitedFetch(url);
  
  if (!data.releases || data.releases.length === 0) return null;
  
  // Sort releases to find the canonical one
  const sortedReleases = data.releases.sort((a: any, b: any) => {
    // Prefer official releases
    if (a.status !== b.status) {
      if (a.status === 'Official') return -1;
      if (b.status === 'Official') return 1;
    }
    
    // Then prefer earlier dates
    if (a.date && b.date) {
      return a.date.localeCompare(b.date);
    }
    
    return 0;
  });
  
  // Return the first official release, or the first release if no official ones
  return sortedReleases.find((r: any) => r.status === 'Official') || sortedReleases[0];
}

// Step 4: For Each Release: Get Songs
async function getReleaseTracks(releaseMbid: string): Promise<any[]> {
  const url = `${MUSICBRAINZ_BASE_URL}/release/${releaseMbid}?inc=recordings+url-rels&fmt=json`;
  const data = await rateLimitedFetch(url);
  
  const tracks: any[] = [];
  
  if (data.media) {
    for (const medium of data.media) {
      if (medium.tracks) {
        tracks.push(...medium.tracks);
      }
    }
  }
  
  return tracks;
}

// Step 5: Extract External IDs from relationships
function extractExternalIds(relations: any[]): Record<string, string> {
  const externalIds: Record<string, string> = {};
  
  if (!relations) return externalIds;
  
  for (const relation of relations) {
    if (relation.url?.resource) {
      const url = relation.url.resource;
      
      // Extract various external IDs
      if (url.includes('spotify.com/artist/')) {
        externalIds.spotify_id = url.split('spotify.com/artist/')[1];
      } else if (url.includes('discogs.com/artist/')) {
        externalIds.discogs_artist_id = url.split('discogs.com/artist/')[1].split('-')[0];
      } else if (url.includes('genius.com/artists/')) {
        externalIds.genius_artist_id = url.split('genius.com/artists/')[1];
      } else if (url.includes('wikidata.org/wiki/')) {
        externalIds.wikidata_id = url.split('wikidata.org/wiki/')[1];
      } else if (url.includes('last.fm/music/')) {
        externalIds.lastfm_url = url;
      } else if (url.includes('youtube.com/channel/')) {
        externalIds.youtube_channel = url.split('youtube.com/channel/')[1];
      } else if (url.includes('instagram.com/')) {
        externalIds.instagram = '@' + url.split('instagram.com/')[1].replace('/', '');
      } else if (url.includes('twitter.com/')) {
        externalIds.twitter = '@' + url.split('twitter.com/')[1].replace('/', '');
      }
    }
  }
  
  return externalIds;
}

// Main collection function
async function collectTopArtists() {
  console.log('🎵 Starting collection of top 100 artists by popularity...\n');
  
  try {
    // Step 1: Get top artists
    const topArtists = await getPopularArtists(100);
    
    let processedCount = 0;
    
    for (const artist of topArtists) {
      processedCount++;
      console.log(`\n[${processedCount}/100] Processing ${artist.name}...`);
      
      try {
        // Extract data
        const genres = artist.tags?.map((tag: any) => tag.name) || [];
        const externalIds = extractExternalIds(artist.relations);
        const formedYear = artist['life-span']?.begin 
          ? parseInt(artist['life-span'].begin.split('-')[0]) 
          : null;
        
        // Insert artist
        const artistData = {
          id: artist.id,
          name: artist.name,
          slug: createSlug(artist.name),
          urlSlug: createSlug(artist.name), // TODO: Handle duplicates
          country: artist.country || null,
          formedYear,
          genres: genres.length > 0 ? JSON.stringify(genres) : null,
          members: null, // Will need other sources
          bio: null, // Will need other sources
          images: null, // Will need other sources
          wikidataId: externalIds.wikidata_id || null,
          externalIds: JSON.stringify(externalIds),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await db.insert(artists).values(artistData).onConflictDoNothing();
        console.log(`  ✓ Inserted artist: ${artist.name}`);
        
        // Step 2: Get albums
        const albumsData = await getArtistAlbums(artist.id);
        console.log(`  📀 Found ${albumsData.length} studio albums`);
        
        // Process top 10 albums
        const albumsToProcess = albumsData.slice(0, 10);
        
        for (const albumData of albumsToProcess) {
          try {
            // Step 3: Get canonical release
            const canonicalRelease = await getCanonicalRelease(albumData.id);
            
            if (!canonicalRelease) {
              console.log(`    ⚠️  No canonical release found for ${albumData.title}`);
              continue;
            }
            
            // Insert album
            const album = {
              id: albumData.id,
              title: albumData.title,
              slug: createSlug(albumData.title),
              artistId: artist.id,
              releaseDate: albumData['first-release-date'] 
                ? new Date(albumData['first-release-date']) 
                : null,
              trackCount: 0, // Will update after getting tracks
              genres: genres.length > 0 ? JSON.stringify(genres) : null, // Inherit from artist
              coverArt: null, // Will fetch separately
              credits: null, // Will need other sources
              wikidataId: null,
              externalIds: JSON.stringify(extractExternalIds(albumData.relations || [])),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Step 4: Get tracks
            const tracks = await getReleaseTracks(canonicalRelease.id);
            album.trackCount = tracks.length;
            
            await db.insert(albums).values(album).onConflictDoNothing();
            console.log(`    ✓ Inserted album: ${albumData.title} (${tracks.length} tracks)`);
            
            // Insert tracks
            for (const track of tracks) {
              if (!track.recording) continue;
              
              const songData = {
                id: track.recording.id,
                title: track.recording.title,
                slug: createSlug(track.recording.title),
                duration: track.recording.length ? Math.floor(track.recording.length / 1000) : null,
                artistId: artist.id,
                albumId: albumData.id,
                releaseDate: album.releaseDate,
                lyrics: null, // Will need Genius API
                annotations: null, // Will need Genius API
                credits: null, // Will need other sources
                isrc: null, // Not in basic API
                wikidataId: null,
                externalIds: JSON.stringify(extractExternalIds(track.recording.relations || [])),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await db.insert(songs).values(songData).onConflictDoNothing();
            }
            
          } catch (error) {
            console.error(`    ❌ Error processing album ${albumData.title}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing artist ${artist.name}:`, error);
      }
    }
    
    console.log('\n✅ Data collection complete!');
    
    // Show summary
    const artistCount = await db.select({ count: artists.id }).from(artists);
    const albumCount = await db.select({ count: albums.id }).from(albums);
    const songCount = await db.select({ count: songs.id }).from(songs);
    
    console.log('\n📊 Database Summary:');
    console.log(`  - Artists: ${artistCount.length}`);
    console.log(`  - Albums: ${albumCount.length}`);
    console.log(`  - Songs: ${songCount.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
collectTopArtists().catch(console.error);