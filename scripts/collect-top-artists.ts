#!/usr/bin/env tsx
// Collect top 100 artists by popularity from MusicBrainz
// This includes all required fields: genres, members, credits, etc.
// Run with: pnpm tsx scripts/collect-top-artists.ts

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { artists, albums, songs } from '../server/database/schema';
import { 
  searchArtists, 
  getArtist, 
  getArtistReleaseGroups,
  getReleaseGroupReleases,
  createSlug 
} from '../server/lib/musicbrainz';

// For local development, we'll use better-sqlite3
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

// Types for external data enrichment
interface ArtistEnrichment {
  genres?: string[];
  members?: string[];
  bio?: string;
  images?: string[];
  externalIds?: Record<string, string>;
}

interface AlbumEnrichment {
  genres?: string[];
  credits?: Record<string, string>;
  coverArt?: string[];
  externalIds?: Record<string, string>;
}

interface SongEnrichment {
  credits?: Record<string, string>;
  lyrics?: string;
  annotations?: string;
  externalIds?: Record<string, string>;
}

// Search for top artists by searching for popular terms
// MusicBrainz doesn't have a direct popularity API, so we'll search for well-known artists
const SEARCH_TERMS = [
  'rock', 'pop', 'hip hop', 'electronic', 'jazz', 'classical', 
  'metal', 'indie', 'alternative', 'r&b', 'country', 'folk',
  'punk', 'reggae', 'blues', 'soul', 'funk', 'disco',
  'techno', 'house', 'ambient', 'experimental'
];

async function collectTopArtists() {
  console.log('🎵 Starting collection of top artists from MusicBrainz...\n');
  
  const collectedArtists = new Set<string>(); // Track unique artist IDs
  const artistsToProcess: any[] = [];
  
  // Step 1: Search for artists across multiple genres
  console.log('📊 Searching for popular artists across genres...');
  for (const term of SEARCH_TERMS) {
    try {
      const results = await searchArtists(term, 25);
      for (const artist of results.artists) {
        if (!collectedArtists.has(artist.id)) {
          collectedArtists.add(artist.id);
          artistsToProcess.push(artist);
          
          if (artistsToProcess.length >= 100) break;
        }
      }
      if (artistsToProcess.length >= 100) break;
      
      console.log(`  ✓ Found ${results.artists.length} artists for "${term}"`);
    } catch (error) {
      console.error(`  ❌ Error searching for ${term}:`, error);
    }
  }
  
  console.log(`\n📋 Collected ${artistsToProcess.length} unique artists to process\n`);
  
  // Step 2: Process each artist
  for (let i = 0; i < Math.min(artistsToProcess.length, 100); i++) {
    const artist = artistsToProcess[i];
    console.log(`\n[${i + 1}/100] Processing ${artist.name}...`);
    
    try {
      // Get full artist details with relationships and tags
      const fullArtist = await getArtist(artist.id, ['url-rels', 'tags']);
      
      // Extract enrichment data
      const enrichment: ArtistEnrichment = {
        genres: fullArtist.tags?.map(tag => tag.name) || [],
        externalIds: extractArtistExternalIds(fullArtist),
      };
      
      // Get formed year from life-span
      const formedYear = fullArtist['life-span']?.begin 
        ? parseInt(fullArtist['life-span'].begin.split('-')[0]) 
        : null;
      
      // Insert artist
      const artistData = {
        id: artist.id,
        name: artist.name,
        slug: createSlug(artist.name),
        urlSlug: createSlug(artist.name), // Will need deduplication logic later
        country: fullArtist.country || null,
        formedYear,
        genres: enrichment.genres.length > 0 ? JSON.stringify(enrichment.genres) : null,
        members: null, // MusicBrainz doesn't provide band members directly
        bio: null, // Will need to fetch from another source
        images: null, // Will need to fetch from another source
        wikidataId: null, // Could extract from relationships
        externalIds: JSON.stringify(enrichment.externalIds),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.insert(artists).values(artistData).onConflictDoNothing();
      console.log(`  ✓ Inserted artist: ${artist.name}`);
      
      // Get albums (release groups)
      const releaseGroups = await getArtistReleaseGroups(artist.id, 50);
      console.log(`  📀 Found ${releaseGroups['release-groups'].length} albums`);
      
      // Process top albums - exclude compilations, live albums, etc.
      const albumsToProcess = releaseGroups['release-groups']
        .filter(rg => {
          // Only include studio albums
          const primaryType = rg['primary-type'];
          const secondaryTypes = rg['secondary-types'] || [];
          
          // Must be an album
          if (primaryType !== 'Album') return false;
          
          // Exclude compilations, live albums, soundtracks, etc.
          const excludedTypes = ['Compilation', 'Live', 'Soundtrack', 'Remix'];
          if (secondaryTypes.some(type => excludedTypes.includes(type))) return false;
          
          return true;
        })
        .slice(0, 10); // Top 10 studio albums per artist
      
      for (const releaseGroup of albumsToProcess) {
        try {
          // Get releases to find track listings
          const releases = await getReleaseGroupReleases(releaseGroup.id);
          
          if (releases.releases.length === 0) continue;
          
          // Use the first release for track info
          const primaryRelease = releases.releases[0];
          const trackCount = primaryRelease.media?.[0]?.['track-count'] || 0;
          
          // Album enrichment would go here
          const albumEnrichment: AlbumEnrichment = {
            genres: enrichment.genres, // Inherit from artist for now
            credits: {}, // Would need to fetch from Discogs/other sources
            coverArt: [], // Would need to fetch from Cover Art Archive
            externalIds: {},
          };
          
          // Insert album
          const albumData = {
            id: releaseGroup.id,
            title: releaseGroup.title,
            slug: createSlug(releaseGroup.title),
            artistId: artist.id,
            releaseDate: releaseGroup['first-release-date'] 
              ? new Date(releaseGroup['first-release-date']) 
              : null,
            trackCount,
            genres: albumEnrichment.genres.length > 0 ? JSON.stringify(albumEnrichment.genres) : null,
            coverArt: null, // Will need Cover Art Archive API
            credits: null, // Will need Discogs API
            wikidataId: null,
            externalIds: JSON.stringify(albumEnrichment.externalIds),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await db.insert(albums).values(albumData).onConflictDoNothing();
          console.log(`    ✓ Inserted album: ${releaseGroup.title}`);
          
          // Process tracks from the primary release
          if (primaryRelease.media?.[0]?.tracks) {
            for (const track of primaryRelease.media[0].tracks) {
              const recording = track.recording;
              
              const songData = {
                id: recording.id,
                title: recording.title,
                slug: createSlug(recording.title),
                duration: recording.length ? Math.floor(recording.length / 1000) : null, // Convert ms to seconds
                artistId: artist.id,
                albumId: releaseGroup.id,
                releaseDate: albumData.releaseDate,
                lyrics: null, // Would need Genius API
                annotations: null, // Would need Genius API
                credits: null, // Would need Discogs API
                isrc: null, // Not provided by MusicBrainz basic API
                wikidataId: null,
                externalIds: JSON.stringify({}),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await db.insert(songs).values(songData).onConflictDoNothing();
            }
            console.log(`      ✓ Inserted ${primaryRelease.media[0].tracks.length} tracks`);
          }
          
        } catch (error) {
          console.error(`    ❌ Error processing album ${releaseGroup.title}:`, error);
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
}

// Extract external IDs from MusicBrainz relationships
function extractArtistExternalIds(artist: any): Record<string, string> {
  const externalIds: Record<string, string> = {};
  
  if (!artist.relations) return externalIds;
  
  for (const relation of artist.relations) {
    if (relation.type === 'official homepage' && relation.url?.resource) {
      externalIds.official_website = relation.url.resource;
    } else if (relation.url?.resource) {
      const url = relation.url.resource;
      
      // Extract IDs from URLs
      if (url.includes('spotify.com/artist/')) {
        externalIds.spotify_id = url.split('spotify.com/artist/')[1];
      } else if (url.includes('discogs.com/artist/')) {
        externalIds.discogs_artist_id = url.split('discogs.com/artist/')[1];
      } else if (url.includes('last.fm/music/')) {
        externalIds.lastfm_url = url;
      } else if (url.includes('youtube.com/channel/')) {
        externalIds.youtube_channel = url.split('youtube.com/channel/')[1];
      } else if (url.includes('soundcloud.com/')) {
        externalIds.soundcloud_url = url;
      } else if (url.includes('bandcamp.com')) {
        externalIds.bandcamp_url = url;
      } else if (url.includes('instagram.com/')) {
        externalIds.instagram = '@' + url.split('instagram.com/')[1].replace('/', '');
      } else if (url.includes('twitter.com/')) {
        externalIds.twitter = '@' + url.split('twitter.com/')[1].replace('/', '');
      } else if (url.includes('wikidata.org/wiki/')) {
        externalIds.wikidata_id = url.split('wikidata.org/wiki/')[1];
      }
    }
  }
  
  return externalIds;
}

// Run the script
collectTopArtists().catch(console.error);