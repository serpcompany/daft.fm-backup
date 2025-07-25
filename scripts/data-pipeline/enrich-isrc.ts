#!/usr/bin/env tsx
// Enrich ISRC codes from MusicBrainz
// Run with: pnpm tsx scripts/data-pipeline/enrich-isrc.ts

import { eq, isNull, or } from 'drizzle-orm'
import { songs } from '../../server/database/schema'
import { getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'

async function fetchISRC(recordingId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/recording/${recordingId}?inc=isrcs&fmt=json`,
      {
        headers: {
          'User-Agent': 'daft.fm/1.0 (https://daft.fm)'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Get first ISRC if available
    if (data.isrcs && data.isrcs.length > 0) {
      return data.isrcs[0]
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching ISRC for recording ${recordingId}:`, error)
    return null
  }
}

async function main() {
  console.log('🎵 Starting ISRC enrichment from MusicBrainz...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(1000) // 1 request per second (MusicBrainz rate limit)
  
  // Get songs missing ISRC that have MusicBrainz IDs
  const missingSongs = await db.select()
    .from(songs)
    .where(
      or(
        isNull(songs.isrc),
        eq(songs.isrc, '')
      )
    )
    .limit(50) // Start with 50 songs
    .all()
  
  const songsWithMbid = missingSongs.filter(s => s.musicbrainzId && s.musicbrainzId.match(/^[0-9a-f-]{36}$/))
  
  console.log(`Found ${songsWithMbid.length} songs with MusicBrainz IDs missing ISRC`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const song of songsWithMbid) {
    progress.processed++
    
    try {
      // Rate limit
      await rateLimiter.throttle()
      
      // Fetch ISRC
      const isrc = await fetchISRC(song.musicbrainzId!)
      
      if (isrc) {
        // Update song
        await db.update(songs)
          .set({
            isrc,
            updatedAt: new Date()
          })
          .where(eq(songs.id, song.id))
        
        progress.updated++
        console.log(`✅ "${song.title}" - ISRC: ${isrc}`)
      } else {
        progress.skipped++
        console.log(`⏭️  "${song.title}" - No ISRC found`)
      }
      
      // Progress report every 10 songs
      if (progress.processed % 10 === 0) {
        console.log(`\n📊 Progress: ${progress.processed}/${songsWithMbid.length} (${Math.round(progress.processed * 100 / songsWithMbid.length)}%)`)
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
  console.log('\n✨ ISRC enrichment complete!')
}

// Run the enrichment
main().catch(console.error)