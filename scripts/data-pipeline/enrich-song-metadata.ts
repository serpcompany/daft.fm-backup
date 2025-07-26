#!/usr/bin/env tsx
// Enrich song metadata using Genius API
// Gets Genius song IDs and URLs (actual lyrics require web scraping)
// Run with: pnpm tsx scripts/data-pipeline/enrich-song-metadata.ts

import { eq, isNull, or, and } from 'drizzle-orm'
import { songs, artists } from '../../server/database/schema'
import { searchSong, getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  const token = process.env.GENIUS_API_CLIENT_ACCESS_TOKEN || process.env.GENIUS_ACCESS_TOKEN
  
  if (!token) {
    console.error('❌ GENIUS_API_CLIENT_ACCESS_TOKEN not found in environment variables')
    console.log('\n💡 To get a Genius API token:')
    console.log('   1. Go to https://genius.com/api-clients')
    console.log('   2. Create a new API client')
    console.log('   3. Add GENIUS_API_CLIENT_ACCESS_TOKEN=your_token to .env')
    process.exit(1)
  }
  
  console.log('🎵 Starting song metadata enrichment using Genius...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(200) // 5 requests per second
  
  // Get songs missing Genius ID
  const missingSongs = await db.select({
    song: songs,
    artist: artists
  })
    .from(songs)
    .innerJoin(artists, eq(songs.artistId, artists.id))
    .where(
      and(
        or(isNull(songs.externalIds), eq(songs.externalIds, ''), eq(songs.externalIds, '{}')),
        isNull(songs.geniusSongId)
      )
    )
    .limit(50) // Start with 50 songs
    .all()
  
  console.log(`Found ${missingSongs.length} songs to process`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const { song, artist } of missingSongs) {
    progress.processed++
    
    try {
      // Rate limit
      await rateLimiter.throttle()
      
      // Search for song
      const query = `${artist.name} ${song.title}`
      const geniusId = await searchSong(token, query)
      
      if (geniusId) {
        // Parse existing external IDs
        let externalIds = {}
        try {
          if (song.externalIds && song.externalIds !== '{}') {
            externalIds = JSON.parse(song.externalIds)
          }
        } catch (e) {}
        
        // Add Genius ID
        externalIds = {
          ...externalIds,
          genius_id: geniusId.toString(),
          genius_url: `https://genius.com/songs/${geniusId}`
        }
        
        // Update song
        await db.update(songs)
          .set({
            geniusSongId: geniusId.toString(),
            externalIds: JSON.stringify(externalIds),
            updatedAt: new Date()
          })
          .where(eq(songs.id, song.id))
        
        progress.updated++
        console.log(`✅ "${song.title}" by ${artist.name} - Found Genius ID: ${geniusId}`)
      } else {
        progress.skipped++
        console.log(`⏭️  "${song.title}" by ${artist.name} - Not found on Genius`)
      }
      
      // Progress report every 10 songs
      if (progress.processed % 10 === 0) {
        console.log(`\n📊 Progress: ${progress.processed}/${missingSongs.length} (${Math.round(progress.processed * 100 / missingSongs.length)}%)`)
        console.log(`   Updated: ${progress.updated}, Skipped: ${progress.skipped}, Failed: ${progress.failed}\n`)
      }
    } catch (error) {
      progress.failed++
      console.error(`❌ "${song.title}" - Error:`, error)
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL REPORT')
  console.log('='.repeat(50))
  console.log(`Total processed: ${progress.processed}`)
  console.log(`✅ Updated: ${progress.updated} (${Math.round(progress.updated * 100 / progress.processed)}%)`)
  console.log(`⏭️  Skipped: ${progress.skipped} (${Math.round(progress.skipped * 100 / progress.processed)}%)`)
  console.log(`❌ Failed: ${progress.failed} (${Math.round(progress.failed * 100 / progress.processed)}%)`)
  console.log('\n💡 Note: Actual lyrics require web scraping from Genius URLs')
  console.log('✨ Song metadata enrichment complete!')
}

// Run the enrichment
main().catch(console.error)