#!/usr/bin/env tsx
// Enrich artist info using Last.fm API
// Run with: pnpm tsx scripts/enrich-artist-info.ts

import { eq, isNull, or } from 'drizzle-orm'
import { artists } from '../../server/database/schema'
import { fetchArtistInfo, getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function main() {
  const apiKey = process.env.LAST_FM_API_KEY
  
  if (!apiKey) {
    console.error('❌ LAST_FM_API_KEY not found in environment variables')
    process.exit(1)
  }
  
  console.log('🎤 Starting artist info enrichment using Last.fm...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(200) // 5 requests per second
  
  // Get artists missing bio or images
  const missingInfo = await db.select()
    .from(artists)
    .where(
      or(
        or(isNull(artists.bio), eq(artists.bio, '')),
        or(isNull(artists.images), eq(artists.images, ''), eq(artists.images, '[]'))
      )
    )
    .all()
  
  console.log(`Found ${missingInfo.length} artists missing bio or images`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const artist of missingInfo) {
    progress.processed++
    
    try {
      // Rate limit
      await rateLimiter.throttle()
      
      // Fetch artist info
      const info = await fetchArtistInfo(apiKey, artist.name)
      
      const updates: any = {}
      let hasUpdates = false
      
      // Update bio if we got one and artist doesn't have one
      if (info.bio && (!artist.bio || artist.bio === '')) {
        updates.bio = info.bio
        hasUpdates = true
      }
      
      // Update images if we got them and artist doesn't have any
      if (info.images && info.images.length > 0 && (!artist.images || artist.images === '' || artist.images === '[]')) {
        updates.images = JSON.stringify(info.images)
        hasUpdates = true
      }
      
      if (hasUpdates) {
        updates.updatedAt = new Date()
        
        await db.update(artists)
          .set(updates)
          .where(eq(artists.id, artist.id))
        
        progress.updated++
        console.log(`✅ ${artist.name} - Updated ${Object.keys(updates).length - 1} field(s)`)
      } else {
        progress.skipped++
        console.log(`⏭️  ${artist.name} - No new data found`)
      }
      
      // Progress report every 10 artists
      if (progress.processed % 10 === 0) {
        console.log(`\n📊 Progress: ${progress.processed}/${missingInfo.length} (${Math.round(progress.processed * 100 / missingInfo.length)}%)`)
        console.log(`   Updated: ${progress.updated}, Skipped: ${progress.skipped}, Failed: ${progress.failed}\n`)
      }
    } catch (error) {
      progress.failed++
      console.error(`❌ ${artist.name} - Error:`, error)
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
  console.log('\n✨ Artist info enrichment complete!')
}

// Run the enrichment
main().catch(console.error)