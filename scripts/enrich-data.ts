#!/usr/bin/env tsx
// Enrich artist/album/song data with additional sources
// This script adds data that MusicBrainz doesn't provide:
// - Album cover art (from Cover Art Archive)
// - Artist images (from Wikimedia/Last.fm)
// - Genres (from Last.fm tags)
// - Credits (from Discogs)
// - Lyrics (from Genius)
// Run with: pnpm tsx scripts/enrich-data.ts

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { artists, albums, songs } from '../server/database/schema';

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

// Cover Art Archive API (MusicBrainz's official cover art service)
async function fetchAlbumCoverArt(releaseGroupId: string): Promise<string[] | null> {
  try {
    const response = await fetch(`https://coverartarchive.org/release-group/${releaseGroupId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const images = data.images || [];
    
    // Get URLs for different sizes, prefer front covers
    const coverUrls = images
      .filter((img: any) => img.front || images.length === 1)
      .map((img: any) => img.thumbnails?.['500'] || img.thumbnails?.large || img.image)
      .filter(Boolean);
    
    return coverUrls.length > 0 ? coverUrls : null;
  } catch (error) {
    return null;
  }
}

// Last.fm API for additional genre tags and artist images
// Note: You'll need a Last.fm API key for production
async function fetchLastFmData(artistName: string): Promise<{
  genres?: string[];
  images?: string[];
  bio?: string;
} | null> {
  // Placeholder - would need API key
  // const API_KEY = process.env.LASTFM_API_KEY;
  // const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
  
  return null;
}

// Discogs API for credits
// Note: You'll need Discogs API credentials for production
async function fetchDiscogsCredits(discogsId: string): Promise<Record<string, string> | null> {
  // Placeholder - would need API credentials
  // const url = `https://api.discogs.com/releases/${discogsId}`;
  
  return null;
}

// Genius API for lyrics and annotations
// Note: You'll need a Genius API key for production
async function fetchGeniusData(songTitle: string, artistName: string): Promise<{
  lyrics?: string;
  annotations?: string;
  externalIds?: Record<string, string>;
} | null> {
  // Placeholder - would need API key
  // const API_KEY = process.env.GENIUS_API_KEY;
  
  return null;
}

// Main enrichment function
async function enrichData() {
  console.log('🎨 Starting data enrichment...\n');
  
  // Enrich albums with cover art
  console.log('📀 Enriching albums with cover art...');
  const albumsToEnrich = await db.select().from(albums).limit(100);
  
  console.log(`Found ${albumsToEnrich.length} albums to enrich`);
  
  for (const album of albumsToEnrich) {
    if (album.coverArt) {
      console.log(`  ⏭️  Skipping ${album.title} - already has cover art`);
      continue;
    }
    
    const coverArt = await fetchAlbumCoverArt(album.id);
    if (coverArt) {
      await db.update(albums)
        .set({ 
          coverArt: JSON.stringify(coverArt),
          updatedAt: new Date()
        })
        .where(eq(albums.id, album.id));
      console.log(`  ✓ Added cover art for: ${album.title}`);
    } else {
      console.log(`  ⚠️  No cover art found for: ${album.title}`);
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Additional enrichment would go here:
  // - Artist images from Wikimedia Commons
  // - Genre tags from Last.fm
  // - Credits from Discogs
  // - Lyrics from Genius
  // - Band members from Wikipedia/Wikidata
  
  console.log('\n✅ Enrichment complete!');
}

// Placeholder functions for additional data sources
async function enrichWithWikipedia() {
  // Fetch artist bios and band members from Wikipedia
}

async function enrichWithWikidata() {
  // Fetch structured data including band members
}

async function enrichWithSpotify() {
  // Fetch popularity scores and additional metadata
}

// Run the enrichment
enrichData().catch(console.error);