#!/usr/bin/env tsx
// Collect canonical data following the data collection strategy
// This script ensures we only get main albums and their standard tracks
// Run with: pnpm tsx scripts/data-pipeline/collect-canonical-data.ts

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

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

// Curated list of top artists
const TOP_ARTISTS = [
  'The Beatles', 'The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'Queen',
  'Nirvana', 'Radiohead', 'Red Hot Chili Peppers', 'Foo Fighters', 'Arctic Monkeys',
  'Michael Jackson', 'Madonna', 'Prince', 'Beyoncé', 'Taylor Swift',
  'Tupac Shakur', 'Eminem', 'Jay-Z', 'Kanye West', 'Kendrick Lamar',
  'Daft Punk', 'The Chemical Brothers', 'Aphex Twin', 'Deadmau5', 'Calvin Harris',
  'Miles Davis', 'John Coltrane', 'Duke Ellington', 'Charlie Parker', 'Herbie Hancock',
  'Johnny Cash', 'Willie Nelson', 'Dolly Parton', 'Hank Williams', 'Garth Brooks',
];

// Helper to check if a track title is a remix/alternate version
function isAlternateVersion(title: string): boolean {
  const versionIndicators = [
    /\(.*(?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub)\)/i,
    /\[.*(?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub)\]/i,
    /- (?:remix|mix|version|live|acoustic|demo|instrumental|radio|single|edit|vocal|alternate|extended|dub)$/i
  ];
  
  return versionIndicators.some(pattern => pattern.test(title));
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
      }
    }
  }
  
  return externalIds;
}

async function collectCanonicalData() {
  console.log('🎵 Starting canonical data collection...\n');
  console.log('Following data collection strategy:');
  console.log('- Main studio albums only (no compilations, singles, etc.)');
  console.log('- Canonical tracks only (no remixes, live versions, etc.)');
  console.log('- Earliest official release for each album\n');
  
  let successCount = 0;
  
  for (const artistName of TOP_ARTISTS) {
    console.log(`\n🎤 Searching for ${artistName}...`);
    
    try {
      // Search for the artist
      const searchResults = await searchArtists(artistName, 5);
      
      if (!searchResults.artists || searchResults.artists.length === 0) {
        console.log(`  ❌ Not found`);
        continue;
      }
      
      // Find best match
      const artist = searchResults.artists.find(a => 
        a.name.toLowerCase() === artistName.toLowerCase()
      ) || searchResults.artists[0];
      
      // Check if artist already exists
      const existingArtist = await db.select()
        .from(artists)
        .where(eq(artists.musicbrainzId, artist.id))
        .get();
      
      if (existingArtist) {
        console.log(`  ⏭️  Artist already exists`);
        continue;
      }
      
      // Get full artist data
      const fullArtist = await getArtist(artist.id, ['url-rels', 'tags']);
      
      // Extract data
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
        externalIds: JSON.stringify(externalIds),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const insertedArtist = await db.insert(artists).values(artistData).returning();
      const dbArtist = insertedArtist[0];
      console.log(`  ✓ Added ${artist.name}`);
      successCount++;
      
      // Get release groups (albums)
      const releaseGroups = await getArtistReleaseGroups(artist.id, 100);
      
      // Filter for main studio albums only
      const studioAlbums = releaseGroups['release-groups'].filter((rg: any) => {
        const secondaryTypes = rg['secondary-types'] || [];
        const excludedTypes = ['Compilation', 'Live', 'Soundtrack', 'Remix', 'Demo', 'Mixtape'];
        return rg['primary-type'] === 'Album' && 
               !secondaryTypes.some((type: string) => excludedTypes.includes(type));
      }).slice(0, 10); // Top 10 albums per artist
      
      console.log(`  📀 Processing ${studioAlbums.length} studio albums`);
      
      for (const albumData of studioAlbums) {
        try {
          // Get all releases for this album
          const releases = await getReleaseGroupReleases(albumData.id);
          
          if (!releases.releases || releases.releases.length === 0) continue;
          
          // Find the canonical release (earliest official release)
          const canonicalRelease = releases.releases
            .filter((r: any) => r.status === 'Official')
            .sort((a: any, b: any) => {
              if (!a.date || !b.date) return 0;
              return a.date.localeCompare(b.date);
            })[0] || releases.releases[0];
          
          // Get full release details with recordings
          const fullRelease = await getRelease(canonicalRelease.id);
          
          // Count canonical tracks (excluding alternate versions)
          let canonicalTrackCount = 0;
          if (fullRelease.media?.[0]?.tracks) {
            canonicalTrackCount = fullRelease.media[0].tracks.filter((track: any) => 
              !isAlternateVersion(track.title)
            ).length;
          }
          
          // Insert album
          const album = {
            title: albumData.title,
            slug: createSlug(albumData.title),
            artistId: dbArtist.id,
            releaseDate: albumData['first-release-date'] 
              ? new Date(albumData['first-release-date']) 
              : null,
            trackCount: canonicalTrackCount,
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
          console.log(`    ✓ ${albumData.title} (${canonicalTrackCount} tracks)`);
          
          // Insert only canonical tracks
          if (fullRelease.media?.[0]?.tracks) {
            let insertedCount = 0;
            
            for (const track of fullRelease.media[0].tracks) {
              // Skip alternate versions
              if (isAlternateVersion(track.title)) {
                continue;
              }
              
              const recording = track.recording;
              
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
                isrc: null,
                wikidataId: null,
                externalIds: JSON.stringify({}),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await db.insert(songs).values(songData).onConflictDoNothing();
              insertedCount++;
            }
            
            console.log(`      ✓ Added ${insertedCount} canonical tracks`);
          }
          
        } catch (error) {
          console.error(`    ❌ Error with album ${albumData.title}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${artistName}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully added ${successCount} new artists!`);
  
  // Show summary
  const stats = sqlite.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM artists) as artists,
      (SELECT COUNT(*) FROM albums) as albums,
      (SELECT COUNT(*) FROM songs) as songs
  `).get() as any;
  
  console.log('\n📊 Database Summary:');
  console.log(`  - Artists: ${stats.artists}`);
  console.log(`  - Albums: ${stats.albums}`);
  console.log(`  - Songs: ${stats.songs}`);
}

// Run the script
collectCanonicalData().catch(console.error);