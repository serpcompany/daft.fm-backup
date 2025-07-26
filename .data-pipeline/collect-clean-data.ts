#!/usr/bin/env tsx
// Collect clean, canonical data following the data collection strategy
// This ensures we only get:
// 1. Main studio albums (no compilations, singles, live albums)
// 2. The earliest official release of each album
// 3. Only the standard tracks (no bonus tracks, remixes, live versions)
// Run with: pnpm tsx scripts/data-pipeline/collect-clean-data.ts

import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { artists, albums, songs } from '../../server/database/schema';
import { 
  searchArtists, 
  getArtist, 
  getArtistReleaseGroups,
  getReleaseGroupReleases,
  getRelease,
  createSlug 
} from '../../server/lib/musicbrainz';
import dotenv from 'dotenv';

// Load environment variables for Musixmatch API
dotenv.config();

// Database connection
import { getProductionDb, getStagingDb } from './config/database';

// Check if we should use staging
const useStaging = process.argv.includes('--staging');
const dbConnection = useStaging ? getStagingDb() : getProductionDb(false);
const { db, sqlite } = dbConnection;

if (useStaging) {
  console.log('🎭 Using STAGING database\n');
} else {
  console.log('⚠️  Using PRODUCTION database directly\n');
}

// Curated list of top artists - LIMITED TO 4 FOR TESTING
const TOP_ARTISTS = [
  'The Beatles',    // Classic Rock
  'Daft Punk',      // Electronic  
  'Radiohead',      // Alternative Rock
  'Miles Davis'     // Jazz (likely to have instrumentals)
];

// Patterns that indicate a track is NOT canonical
const NON_CANONICAL_PATTERNS = [
  // Version indicators in parentheses
  /\([^)]*(?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub|reprise|interlude|intro|outro|skit)\)/i,
  // Version indicators in brackets  
  /\[[^\]]*(?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub|reprise|interlude|intro|outro|skit)\]/i,
  // Version indicators at end
  /\s+-\s+(?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub|reprise)$/i,
  // Bonus track indicators
  /\((?:bonus|hidden|secret|japan|uk|us|deluxe|special|vault)\s+(?:track|edition)\)/i,
  // Multiple mixes or specific producer mixes
  /\((?:\w+\s+)?(?:vocal|instrumental|club|dance|extended|original|piano)\s+mix\)/i,
  /\((?:\w+\s+)?(?:lange|spinna|neptunes?|timbaland)\s+(?:mix|remix)\)/i,
  // Taylor's versions and re-recordings
  /\(.*taylor'?s?\s+version.*\)/i,
  /\(from the vault\)/i,
  // Piano/vocal only versions
  /\(piano\/vocal\)/i,
];

// Check if a track is canonical
function isCanonicalTrack(title: string): boolean {
  return !NON_CANONICAL_PATTERNS.some(pattern => pattern.test(title));
}

// Simple delay function for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a track is instrumental using Musixmatch API
async function checkInstrumentalStatus(title: string, artist: string, isrc?: string): Promise<boolean | null> {
  const apiKey = process.env.MUSIXMATCH_API_KEY;
  if (!apiKey) {
    return null; // Can't check without API key
  }

  try {
    let url = `https://api.musixmatch.com/ws/1.1/track.search?apikey=${apiKey}&format=json&page_size=1`;
    
    if (isrc && isrc.length > 0) {
      url += `&track_isrc=${encodeURIComponent(isrc)}`;
    } else {
      url += `&q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json() as any;
    
    if (data.message.header.status_code !== 200 || 
        !data.message.body.track_list || 
        data.message.body.track_list.length === 0) {
      return null;
    }
    
    const track = data.message.body.track_list[0].track;
    // A track is instrumental if the flag is set OR if it has no lyrics
    return track.instrumental === 1 || track.has_lyrics === 0;
    
  } catch (error) {
    console.error(`Error checking instrumental status: ${error}`);
    return null;
  }
}

// Extract external IDs from relationships
function extractExternalIds(relations: any[]): Record<string, string> {
  const externalIds: Record<string, string> = {};
  
  if (!relations) return externalIds;
  
  for (const relation of relations) {
    if (relation.url?.resource) {
      const url = relation.url.resource;
      
      if (url.includes('spotify.com/artist/')) {
        externalIds.spotify_id = url.split('spotify.com/artist/')[1];
      } else if (url.includes('discogs.com/artist/')) {
        externalIds.discogs_artist_id = url.split('discogs.com/artist/')[1].split('-')[0];
      } else if (url.includes('wikidata.org/wiki/')) {
        externalIds.wikidata_id = url.split('wikidata.org/wiki/')[1];
      } else if (url.includes('last.fm/music/')) {
        externalIds.lastfm_url = url;
      } else if (url.includes('genius.com/artists/')) {
        externalIds.genius_artist_id = url.split('genius.com/artists/')[1];
      }
    }
  }
  
  return externalIds;
}

async function collectCleanData() {
  console.log('🎵 Starting clean data collection...\n');
  console.log('📋 Data Collection Strategy:');
  console.log('   ✓ Main studio albums only');
  console.log('   ✓ Earliest official release');
  console.log('   ✓ Standard tracks only (no remixes/live/bonus)\n');
  
  let stats = {
    artists: 0,
    albums: 0,
    songs: 0,
    instrumental: 0,
    skippedAlbums: 0,
    skippedSongs: 0
  };
  
  for (const artistName of TOP_ARTISTS) {
    console.log(`\n🎤 Processing ${artistName}...`);
    
    try {
      // Search for the artist
      const searchResults = await searchArtists(artistName, 5);
      
      if (!searchResults.artists || searchResults.artists.length === 0) {
        console.log(`  ❌ Not found`);
        continue;
      }
      
      // Find exact match or best match
      const artist = searchResults.artists.find(a => 
        a.name.toLowerCase() === artistName.toLowerCase()
      ) || searchResults.artists[0];
      
      // Get full artist data
      const fullArtist = await getArtist(artist.id, ['url-rels', 'tags']);
      
      // Extract metadata
      const genres = fullArtist.tags?.map((tag: any) => tag.name) || [];
      const externalIds = extractExternalIds(fullArtist.relations);
      const formedYear = fullArtist['life-span']?.begin 
        ? parseInt(fullArtist['life-span'].begin.split('-')[0]) 
        : null;
      
      // Insert artist
      const artistData = {
        name: artist.name,
        slug: createSlug(artist.name),
        urlSlug: createSlug(artist.name),
        country: fullArtist.country || null,
        formedYear,
        genres: genres.length > 0 ? JSON.stringify(genres) : null,
        members: null,
        bio: null,
        images: null,
        musicbrainzId: artist.id,
        wikidataId: externalIds.wikidata_id || null,
        discogsArtistId: externalIds.discogs_artist_id || null,
        spotifyArtistId: externalIds.spotify_id || null,
        lastfmUrl: externalIds.lastfm_url || null,
        externalIds: JSON.stringify(externalIds),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const insertedArtist = await db.insert(artists).values(artistData).returning();
      const dbArtist = insertedArtist[0];
      stats.artists++;
      console.log(`  ✓ Added artist (ID: ${dbArtist.id})`);
      
      // Get all release groups (albums)
      const releaseGroups = await getArtistReleaseGroups(artist.id, 100);
      
      // Filter for main studio albums only
      const studioAlbums = releaseGroups['release-groups']
        .filter((rg: any) => {
          // Must be an album
          if (rg['primary-type'] !== 'Album') return false;
          
          // Skip if it has excluded secondary types
          const secondaryTypes = rg['secondary-types'] || [];
          const excluded = ['Compilation', 'Live', 'Soundtrack', 'Remix', 'Demo', 'Mixtape/Street', 'Interview'];
          if (secondaryTypes.some((type: string) => excluded.includes(type))) {
            stats.skippedAlbums++;
            return false;
          }
          
          // Skip re-recordings and special versions
          const title = rg.title || '';
          
          // Skip Taylor's versions
          if (title.includes("Taylor's version") || 
              title.includes("(Re-recorded)")) {
            stats.skippedAlbums++;
            return false;
          }
          
          // Skip live recordings, interviews, and radio shows
          if (title.includes("Interview") ||
              title.includes("Radio Show") ||
              /\bLive\b/i.test(title) ||
              /\b@\b/.test(title)) { // @ often indicates live venues
            stats.skippedAlbums++;
            return false;
          }
          
          // Skip mashups, beta versions, and demos
          if (title.includes("Mashup") ||
              title.includes("Beta Version") ||
              title.includes("Demo") ||
              title.includes("Unreleased")) {
            stats.skippedAlbums++;
            return false;
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          // Sort by release date to get albums in chronological order
          const dateA = a['first-release-date'] || '9999';
          const dateB = b['first-release-date'] || '9999';
          return dateA.localeCompare(dateB);
        })
        .slice(0, 10); // Max 10 albums per artist
      
      console.log(`  📀 Found ${studioAlbums.length} studio albums (skipped ${stats.skippedAlbums} non-studio)`);
      
      for (const albumData of studioAlbums) {
        try {
          console.log(`\n     💿 ${albumData.title} (${albumData['first-release-date']?.substr(0, 4) || 'unknown year'})`);
          
          // Get all releases for this album
          const releases = await getReleaseGroupReleases(albumData.id);
          
          if (!releases.releases || releases.releases.length === 0) {
            console.log(`        ⚠️  No releases found`);
            continue;
          }
          
          // Find the canonical release:
          // 1. Official status (or any if no official)
          // 2. Earliest release date
          // 3. No bootlegs
          let canonicalRelease = releases.releases
            .filter((r: any) => r.status === 'Official')
            .sort((a: any, b: any) => {
              // Sort by date
              if (a.date && b.date) {
                return a.date.localeCompare(b.date);
              }
              return 0;
            })[0];
          
          // If no official release, take the first non-bootleg
          if (!canonicalRelease) {
            canonicalRelease = releases.releases
              .filter((r: any) => r.status !== 'Bootleg')
              .sort((a: any, b: any) => {
                if (a.date && b.date) {
                  return a.date.localeCompare(b.date);
                }
                return 0;
              })[0];
          }
          
          if (!canonicalRelease) {
            console.log(`        ⚠️  No suitable release found`);
            continue;
          }
          
          console.log(`        📅 Using release from ${canonicalRelease.date || 'unknown date'}`);
          
          // Get full release details with tracks
          const fullRelease = await getRelease(canonicalRelease.id);
          
          // Extract canonical tracks only
          const canonicalTracks: any[] = [];
          if (fullRelease.media && fullRelease.media.length > 0) {
            // Usually we want disc 1 for standard album
            const mainDisc = fullRelease.media[0];
            
            for (const track of mainDisc.tracks || []) {
              if (isCanonicalTrack(track.title)) {
                canonicalTracks.push(track);
              } else {
                stats.skippedSongs++;
                console.log(`        ⏭️  Skipped non-canonical: "${track.title}"`);
              }
            }
          }
          
          // Insert album
          const album = {
            title: albumData.title,
            slug: createSlug(albumData.title),
            artistId: dbArtist.id,
            releaseDate: albumData['first-release-date'] 
              ? new Date(albumData['first-release-date']) 
              : null,
            trackCount: canonicalTracks.length,
            genres: genres.length > 0 ? JSON.stringify(genres) : null,
            coverArt: null,
            credits: null,
            musicbrainzId: albumData.id,
            wikidataId: null,
            externalIds: JSON.stringify({}),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          const insertedAlbum = await db.insert(albums).values(album).returning();
          const dbAlbum = insertedAlbum[0];
          stats.albums++;
          console.log(`        ✓ Added album with ${canonicalTracks.length} tracks`);
          
          // Insert canonical tracks
          let trackPosition = 1;
          for (const track of canonicalTracks) {
            const recording = track.recording;
            
            // Check if track is instrumental via Musixmatch (with rate limiting)
            await delay(100); // Small delay to avoid hitting rate limits
            const isInstrumental = await checkInstrumentalStatus(
              recording.title,
              artist.name,
              recording.isrcs?.[0] || null
            );
            
            const songData = {
              title: recording.title,
              slug: createSlug(recording.title),
              duration: recording.length ? Math.floor(recording.length / 1000) : null,
              artistId: dbArtist.id,
              albumId: dbAlbum.id,
              releaseDate: album.releaseDate,
              lyrics: null,
              annotations: null,
              credits: null,
              musicbrainzId: recording.id,
              musicbrainzRecordingId: recording.id,
              isInstrumental: isInstrumental || false, // Use Musixmatch result or default to false
              isrc: recording.isrcs?.[0] || null,
              wikidataId: null,
              externalIds: JSON.stringify({}),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            await db.insert(songs).values(songData).onConflictDoNothing();
            stats.songs++;
            
            if (isInstrumental === true) {
              stats.instrumental++;
            }
            
            if (isInstrumental !== null) {
              console.log(`           ${recording.title}: ${isInstrumental ? '🎸 instrumental' : '🎤 vocal'}`);
            }
            
            trackPosition++;
          }
          
        } catch (error) {
          console.error(`     ❌ Error with album ${albumData.title}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${artistName}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Data collection complete!\n');
  console.log('📊 Final Statistics:');
  console.log(`   Artists added: ${stats.artists}`);
  console.log(`   Albums added: ${stats.albums}`);
  console.log(`   Songs added: ${stats.songs}`);
  console.log(`   Instrumental songs: ${stats.instrumental} (${Math.round(stats.instrumental * 100 / stats.songs)}%)`);
  console.log(`   Albums skipped (non-studio): ${stats.skippedAlbums}`);
  console.log(`   Songs skipped (non-canonical): ${stats.skippedSongs}`);
  console.log('='.repeat(60));
  
  // Close database connection
  sqlite.close();
}

// Run the script
collectCleanData().catch(console.error).finally(() => {
  // Ensure connection is closed even on error
  if (sqlite && sqlite.open) {
    sqlite.close();
  }
});