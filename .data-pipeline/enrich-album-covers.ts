#!/usr/bin/env tsx
// Enrich album cover art using Cover Art Archive
// Run with: pnpm tsx scripts/enrich-album-covers.ts

import { eq, isNull, or } from 'drizzle-orm'
import { albums } from '../../server/database/schema'
import { fetchAlbumCoverArt, getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'

async function main() {
  console.log('🎨 Starting album cover enrichment...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(1000) // 1 request per second
  
  // Get albums missing cover art
  const missingCoverArt = await db.select()
    .from(albums)
    .where(
      or(
        isNull(albums.coverArt),
        eq(albums.coverArt, ''),
        eq(albums.coverArt, '[]')
      )
    )
    .all()
  
  console.log(`Found ${missingCoverArt.length} albums without cover art`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const album of missingCoverArt) {
    progress.processed++
    
    // Skip if no MusicBrainz ID
    if (!album.musicbrainzId || !album.musicbrainzId.match(/^[0-9a-f-]{36}$/)) {
      progress.skipped++
      continue
    }
    
    try {
      // Rate limit
      await rateLimiter.throttle()
      
      // Fetch cover art
      const coverArtUrls = await fetchAlbumCoverArt(album.musicbrainzId)
      
      if (coverArtUrls.length > 0) {
        // Update album with cover art
        await db.update(albums)
          .set({
            coverArt: JSON.stringify(coverArtUrls),
            updatedAt: new Date()
          })
          .where(eq(albums.id, album.id))
        
        progress.updated++
        console.log(`✅ ${album.title} - Added ${coverArtUrls.length} cover image(s)`)
      } else {
        progress.skipped++
        console.log(`⏭️  ${album.title} - No cover art found`)
      }
      
      // Progress report every 10 albums
      if (progress.processed % 10 === 0) {
        console.log(`\n📊 Progress: ${progress.processed}/${missingCoverArt.length} (${Math.round(progress.processed * 100 / missingCoverArt.length)}%)`)
        console.log(`   Updated: ${progress.updated}, Skipped: ${progress.skipped}, Failed: ${progress.failed}\n`)
      }
    } catch (error) {
      progress.failed++
      console.error(`❌ ${album.title} - Error:`, error)
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
  console.log('\n✨ Album cover enrichment complete!')
}

// Run the enrichment
main().catch(console.error)