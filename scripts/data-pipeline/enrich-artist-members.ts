#!/usr/bin/env tsx
// Enrich artist members from MusicBrainz relationships
// Run with: pnpm tsx scripts/data-pipeline/enrich-artist-members.ts

import { eq, isNull, or } from 'drizzle-orm'
import { artists } from '../../server/database/schema'
import { getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'

interface MemberRelation {
  type: string
  'type-id': string
  direction: string
  artist?: {
    id: string
    name: string
    'sort-name': string
  }
  attributes?: string[]
  begin?: string
  end?: string
  ended?: boolean
}

async function fetchArtistMembers(artistId: string): Promise<any[] | null> {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/${artistId}?inc=artist-rels&fmt=json`,
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
    
    // Filter for member relationships
    const memberRelations = data.relations?.filter((rel: MemberRelation) => 
      rel.type === 'member of band' || 
      rel.type === 'collaboration' ||
      (rel.direction === 'backward' && rel.artist)
    ) || []
    
    if (memberRelations.length === 0) {
      return null
    }
    
    // Extract member info
    const members = memberRelations.map((rel: MemberRelation) => {
      const member: any = {
        name: rel.artist?.name || 'Unknown',
        id: rel.artist?.id
      }
      
      // Add attributes (instruments, vocals, etc)
      if (rel.attributes && rel.attributes.length > 0) {
        member.roles = rel.attributes
      }
      
      // Add time period
      if (rel.begin || rel.end) {
        member.period = {
          begin: rel.begin || null,
          end: rel.end || null,
          ended: rel.ended || false
        }
      }
      
      return member
    })
    
    return members
  } catch (error) {
    console.error(`Error fetching members for artist ${artistId}:`, error)
    return null
  }
}

async function main() {
  console.log('👥 Starting artist members enrichment from MusicBrainz...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(1000) // 1 request per second (MusicBrainz rate limit)
  
  // Get artists missing members info
  const missingMembers = await db.select()
    .from(artists)
    .where(
      or(
        isNull(artists.members),
        eq(artists.members, ''),
        eq(artists.members, '[]')
      )
    )
    .all()
  
  const artistsWithMbid = missingMembers.filter(a => a.musicbrainzId && a.musicbrainzId.match(/^[0-9a-f-]{36}$/))
  
  console.log(`Found ${artistsWithMbid.length} artists missing members info`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const artist of artistsWithMbid) {
    progress.processed++
    
    try {
      // Rate limit
      await rateLimiter.throttle()
      
      // Fetch members
      const members = await fetchArtistMembers(artist.musicbrainzId!)
      
      if (members && members.length > 0) {
        // Update artist
        await db.update(artists)
          .set({
            members: JSON.stringify(members),
            updatedAt: new Date()
          })
          .where(eq(artists.id, artist.id))
        
        progress.updated++
        console.log(`✅ ${artist.name} - Found ${members.length} member(s)`)
        members.forEach(m => {
          const roles = m.roles ? ` (${m.roles.join(', ')})` : ''
          const period = m.period ? ` [${m.period.begin || '?'}-${m.period.end || 'present'}]` : ''
          console.log(`   - ${m.name}${roles}${period}`)
        })
      } else {
        progress.skipped++
        console.log(`⏭️  ${artist.name} - No members found (might be solo artist)`)
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
  console.log('\n✨ Artist members enrichment complete!')
}

// Run the enrichment
main().catch(console.error)