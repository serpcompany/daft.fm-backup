#!/usr/bin/env tsx
// Collect top 100 artists using a curated approach
// Run with: pnpm tsx scripts/collect-top-100.ts

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

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');
const db = drizzleSqlite(sqlite);

// Curated list of top artists to ensure quality
const TOP_ARTISTS = [
  // Classic Rock
  'The Beatles', 'The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'Queen',
  'The Who', 'Jimi Hendrix', 'The Doors', 'Fleetwood Mac', 'Eagles',
  
  // Modern Rock
  'Nirvana', 'Pearl Jam', 'Radiohead', 'Red Hot Chili Peppers', 'Foo Fighters',
  'Arctic Monkeys', 'The Strokes', 'Kings of Leon', 'The Killers', 'Muse',
  
  // Pop
  'Michael Jackson', 'Madonna', 'Prince', 'Whitney Houston', 'Beyoncé',
  'Taylor Swift', 'Ariana Grande', 'Bruno Mars', 'Ed Sheeran', 'The Weeknd',
  
  // Hip Hop
  'Tupac Shakur', 'The Notorious B.I.G.', 'Eminem', 'Jay-Z', 'Kanye West',
  'Kendrick Lamar', 'Drake', 'J. Cole', 'Travis Scott', 'Tyler, the Creator',
  
  // Electronic
  'Daft Punk', 'The Chemical Brothers', 'The Prodigy', 'Aphex Twin', 'Deadmau5',
  'Calvin Harris', 'David Guetta', 'Skrillex', 'Diplo', 'Flume',
  
  // R&B/Soul
  'Stevie Wonder', 'Marvin Gaye', 'Aretha Franklin', 'James Brown', 'Ray Charles',
  'Frank Ocean', 'The Weeknd', 'SZA', 'H.E.R.', 'Daniel Caesar',
  
  // Jazz
  'Miles Davis', 'John Coltrane', 'Duke Ellington', 'Louis Armstrong', 'Charlie Parker',
  'Herbie Hancock', 'Bill Evans', 'Thelonious Monk', 'Billie Holiday', 'Ella Fitzgerald',
  
  // Country
  'Johnny Cash', 'Willie Nelson', 'Dolly Parton', 'Hank Williams', 'Garth Brooks',
  'Shania Twain', 'Taylor Swift', 'Blake Shelton', 'Carrie Underwood', 'Luke Bryan',
  
  // Alternative/Indie
  'The Smiths', 'Joy Division', 'The Cure', 'Depeche Mode', 'New Order',
  'Arcade Fire', 'Vampire Weekend', 'Tame Impala', 'Mac DeMarco', 'Mitski',
  
  // Metal
  'Black Sabbath', 'Metallica', 'Iron Maiden', 'Slayer', 'Megadeth',
  'Pantera', 'Slipknot', 'System of a Down', 'Tool', 'Mastodon'
];

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

async function collectTopArtists() {
  console.log('🎵 Starting collection of top 100 artists...\n');
  
  let successCount = 0;
  
  for (let i = 0; i < TOP_ARTISTS.length && successCount < 100; i++) {
    const artistName = TOP_ARTISTS[i];
    console.log(`\n[${i + 1}/${TOP_ARTISTS.length}] Searching for ${artistName}...`);
    
    try {
      // Search for the artist
      const searchResults = await searchArtists(artistName, 5);
      
      if (!searchResults.artists || searchResults.artists.length === 0) {
        console.log(`  ❌ Not found`);
        continue;
      }
      
      // Find best match (prefer exact name match)
      const artist = searchResults.artists.find(a => 
        a.name.toLowerCase() === artistName.toLowerCase()
      ) || searchResults.artists[0];
      
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
        id: artist.id,
        name: artist.name,
        slug: createSlug(artist.name),
        urlSlug: createSlug(artist.name), // TODO: Handle duplicates
        country: fullArtist.country || null,
        formedYear,
        genres: genres.length > 0 ? JSON.stringify(genres) : null,
        members: null,
        bio: null,
        images: null,
        wikidataId: externalIds.wikidata_id || null,
        externalIds: JSON.stringify(externalIds),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.insert(artists).values(artistData).onConflictDoNothing();
      console.log(`  ✓ Added ${artist.name}`);
      successCount++;
      
      // Get albums
      const releaseGroups = await getArtistReleaseGroups(artist.id, 100);
      
      // Filter studio albums only
      const studioAlbums = releaseGroups['release-groups'].filter((rg: any) => {
        const secondaryTypes = rg['secondary-types'] || [];
        const excludedTypes = ['Compilation', 'Live', 'Soundtrack', 'Remix', 'Demo', 'Mixtape'];
        return rg['primary-type'] === 'Album' && 
               !secondaryTypes.some((type: string) => excludedTypes.includes(type));
      }).slice(0, 5); // Top 5 albums per artist
      
      console.log(`  📀 Processing ${studioAlbums.length} studio albums`);
      
      for (const albumData of studioAlbums) {
        try {
          // Get releases to find track info
          const releases = await getReleaseGroupReleases(albumData.id);
          
          if (!releases.releases || releases.releases.length === 0) continue;
          
          // Use first official release
          const release = releases.releases.find((r: any) => r.status === 'Official') || releases.releases[0];
          const trackCount = release.media?.[0]?.['track-count'] || 0;
          
          // Insert album
          const album = {
            id: albumData.id,
            title: albumData.title,
            slug: createSlug(albumData.title),
            artistId: artist.id,
            releaseDate: albumData['first-release-date'] 
              ? new Date(albumData['first-release-date']) 
              : null,
            trackCount,
            genres: genres.length > 0 ? JSON.stringify(genres) : null,
            coverArt: null,
            credits: null,
            wikidataId: null,
            externalIds: JSON.stringify({}),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await db.insert(albums).values(album).onConflictDoNothing();
          console.log(`    ✓ ${albumData.title}`);
          
          // Insert tracks
          if (release.media?.[0]?.tracks) {
            for (const track of release.media[0].tracks) {
              const recording = track.recording;
              
              const songData = {
                id: recording.id,
                title: recording.title,
                slug: createSlug(recording.title),
                duration: recording.length ? Math.floor(recording.length / 1000) : null,
                artistId: artist.id,
                albumId: albumData.id,
                releaseDate: album.releaseDate,
                lyrics: null,
                annotations: null,
                credits: null,
                isrc: null,
                wikidataId: null,
                externalIds: JSON.stringify({}),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await db.insert(songs).values(songData).onConflictDoNothing();
            }
          }
          
        } catch (error) {
          console.error(`    ❌ Error with album ${albumData.title}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${artistName}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully added ${successCount} artists!`);
  
  // Show summary
  const artistCount = await db.select({ count: artists.id }).from(artists);
  const albumCount = await db.select({ count: albums.id }).from(albums);
  const songCount = await db.select({ count: songs.id }).from(songs);
  
  console.log('\n📊 Database Summary:');
  console.log(`  - Artists: ${artistCount.length}`);
  console.log(`  - Albums: ${albumCount.length}`);
  console.log(`  - Songs: ${songCount.length}`);
}

// Run the script
collectTopArtists().catch(console.error);