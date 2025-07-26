#!/usr/bin/env tsx
// Enrich data using external APIs with the provided keys
// Run with: pnpm tsx scripts/enrich-with-apis.ts

import { drizzle } from 'drizzle-orm/d1';
import { eq, isNull } from 'drizzle-orm';
import { artists, albums, songs } from '../../server/database/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

// API Keys from environment
const LASTFM_API_KEY = process.env.LAST_FM_API_KEY;
const DISCOGS_TOKEN = `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`;
const GENIUS_TOKEN = process.env.GENIUS_API_CLIENT_ACCESS_TOKEN;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Rate limiting helpers
const rateLimits = {
  lastfm: { delay: 200 }, // 5 requests per second
  discogs: { delay: 1000 }, // 60 per minute = 1 per second
  genius: { delay: 500 }, // Be conservative
  spotify: { delay: 100 }, // 10 per second
  wikipedia: { delay: 100 } // Be respectful
};

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Last.fm API - Artist bios and images
async function fetchLastFmArtistData(artistName: string) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.artist) {
      const artist = data.artist;
      return {
        bio: artist.bio?.content?.replace(/<[^>]*>/g, '').trim(), // Strip HTML
        images: artist.image?.filter((img: any) => img.size === 'extralarge').map((img: any) => img['#text']).filter(Boolean) || [],
        listeners: parseInt(artist.stats?.listeners) || 0,
        playcount: parseInt(artist.stats?.playcount) || 0
      };
    }
    return null;
  } catch (error) {
    console.error(`Last.fm error for ${artistName}:`, error);
    return null;
  }
}

// Wikipedia API - Band members and additional bio
async function fetchWikipediaData(artistName: string) {
  try {
    // Search for the artist
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistName)}&format=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.query?.search?.[0]) {
      const pageId = searchData.query.search[0].pageid;
      
      // Get page content
      const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&exsectionformat=plain&pageids=${pageId}&format=json`;
      const contentResponse = await fetch(contentUrl);
      const contentData = await contentResponse.json();
      
      const page = contentData.query.pages[pageId];
      
      // Try to extract members from the intro text
      const extract = page.extract || '';
      const membersMatch = extract.match(/members?\s+(?:are|were|include[sd]?|consist[sed]* of)\s+([^.]+)/i);
      let members: string[] = [];
      
      if (membersMatch) {
        members = membersMatch[1]
          .split(/,|and/)
          .map(m => m.trim())
          .filter(m => m.length > 0 && m.length < 50); // Filter out long phrases
      }
      
      return {
        bio: extract.substring(0, 1000), // First 1000 chars
        members,
        wikipediaUrl: `https://en.wikipedia.org/?curid=${pageId}`
      };
    }
    return null;
  } catch (error) {
    console.error(`Wikipedia error for ${artistName}:`, error);
    return null;
  }
}

// Genius API - Song lyrics and credits
async function fetchGeniusData(songTitle: string, artistName: string) {
  try {
    // Search for the song
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${songTitle} ${artistName}`)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`
      }
    });
    const data = await response.json();
    
    if (data.response?.hits?.[0]) {
      const hit = data.response.hits[0].result;
      
      // Get full song data
      const songUrl = `https://api.genius.com/songs/${hit.id}`;
      const songResponse = await fetch(songUrl, {
        headers: {
          'Authorization': `Bearer ${GENIUS_TOKEN}`
        }
      });
      const songData = await songResponse.json();
      
      if (songData.response?.song) {
        const song = songData.response.song;
        
        // Extract credits
        const credits: any[] = [];
        if (song.producer_artists?.length > 0) {
          song.producer_artists.forEach((artist: any) => {
            credits.push({ name: artist.name, roles: ['producer'] });
          });
        }
        if (song.writer_artists?.length > 0) {
          song.writer_artists.forEach((artist: any) => {
            credits.push({ name: artist.name, roles: ['writer'] });
          });
        }
        
        return {
          geniusId: song.id,
          url: song.url,
          credits: credits.length > 0 ? JSON.stringify(credits) : null,
          // Note: Lyrics require additional scraping - Genius API doesn't provide them directly
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Genius error for ${songTitle}:`, error);
    return null;
  }
}

// Spotify API - Get access token
let spotifyToken: string | null = null;
let spotifyTokenExpiry: number = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  spotifyToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
  
  return spotifyToken;
}

// Spotify API - Audio features
async function fetchSpotifyData(songTitle: string, artistName: string) {
  try {
    const token = await getSpotifyToken();
    
    // Search for the track
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:${songTitle} artist:${artistName}`)}&type=track&limit=1`;
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.tracks?.items?.[0]) {
      const track = data.tracks.items[0];
      
      // Get audio features
      const featuresUrl = `https://api.spotify.com/v1/audio-features/${track.id}`;
      const featuresResponse = await fetch(featuresUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const features = await featuresResponse.json();
      
      return {
        spotifyId: track.id,
        duration: Math.floor(track.duration_ms / 1000),
        popularity: track.popularity,
        audioFeatures: {
          tempo: features.tempo,
          key: features.key,
          mode: features.mode,
          energy: features.energy,
          danceability: features.danceability,
          acousticness: features.acousticness,
          instrumentalness: features.instrumentalness,
          liveness: features.liveness,
          valence: features.valence,
          loudness: features.loudness,
          time_signature: features.time_signature
        }
      };
    }
    return null;
  } catch (error) {
    console.error(`Spotify error for ${songTitle}:`, error);
    return null;
  }
}

// Main enrichment function
async function enrichData() {
  console.log('🎨 Starting API enrichment...\n');
  
  // 1. Enrich Artists
  console.log('👤 Enriching artists...');
  const artistsToEnrich = await db.select().from(artists).where(isNull(artists.bio)).limit(30);
  
  for (const artist of artistsToEnrich) {
    console.log(`  Processing ${artist.name}...`);
    
    // Fetch from multiple sources
    const [lastfmData, wikiData] = await Promise.all([
      fetchLastFmArtistData(artist.name),
      fetchWikipediaData(artist.name)
    ]);
    
    const updates: any = {};
    
    // Prefer Wikipedia bio if longer, otherwise Last.fm
    if (wikiData?.bio && (!lastfmData?.bio || wikiData.bio.length > lastfmData.bio.length)) {
      updates.bio = wikiData.bio;
    } else if (lastfmData?.bio) {
      updates.bio = lastfmData.bio;
    }
    
    // Images from Last.fm
    if (lastfmData?.images && lastfmData.images.length > 0) {
      updates.images = JSON.stringify(lastfmData.images);
    }
    
    // Members from Wikipedia
    if (wikiData?.members && wikiData.members.length > 0) {
      updates.members = JSON.stringify(wikiData.members);
    }
    
    // Update if we have any data
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(artists).set(updates).where(eq(artists.id, artist.id));
      console.log(`    ✓ Updated with: ${Object.keys(updates).join(', ')}`);
    }
    
    await wait(Math.max(rateLimits.lastfm.delay, rateLimits.wikipedia.delay));
  }
  
  // 2. Enrich Songs with Genius and Spotify
  console.log('\n🎵 Enriching songs...');
  const songsToEnrich = await db.select({
    song: songs,
    artistName: artists.name
  })
  .from(songs)
  .innerJoin(artists, eq(songs.artistId, artists.id))
  .where(isNull(songs.credits))
  .limit(50);
  
  for (const { song, artistName } of songsToEnrich) {
    console.log(`  Processing "${song.title}" by ${artistName}...`);
    
    const [geniusData, spotifyData] = await Promise.all([
      fetchGeniusData(song.title, artistName),
      fetchSpotifyData(song.title, artistName)
    ]);
    
    const updates: any = {};
    
    // Credits from Genius
    if (geniusData?.credits) {
      updates.credits = geniusData.credits;
    }
    
    // Update external IDs
    const externalIds = JSON.parse(song.externalIds || '{}');
    if (geniusData?.geniusId) {
      externalIds.genius_song_id = geniusData.geniusId;
    }
    if (spotifyData?.spotifyId) {
      externalIds.spotify_track_id = spotifyData.spotifyId;
    }
    if (Object.keys(externalIds).length > 0) {
      updates.externalIds = JSON.stringify(externalIds);
    }
    
    // Update duration if we don't have it
    if (!song.duration && spotifyData?.duration) {
      updates.duration = spotifyData.duration;
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(songs).set(updates).where(eq(songs.id, song.id));
      console.log(`    ✓ Updated with: ${Object.keys(updates).join(', ')}`);
    }
    
    await wait(Math.max(rateLimits.genius.delay, rateLimits.spotify.delay));
  }
  
  console.log('\n✅ API enrichment complete!');
  
  // Show updated stats
  const stats = await db.select({
    artistsWithBio: artists.bio,
    artistsWithImages: artists.images,
    artistsWithMembers: artists.members,
    songsWithCredits: songs.credits
  }).from(artists);
  
  console.log('\n📊 Enrichment Stats:');
  console.log(`  - Artists with bios: ${stats.filter(s => s.artistsWithBio).length}`);
  console.log(`  - Artists with images: ${stats.filter(s => s.artistsWithImages).length}`);
  console.log(`  - Artists with members: ${stats.filter(s => s.artistsWithMembers).length}`);
}

// Run the enrichment
enrichData().catch(console.error);