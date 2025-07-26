#!/usr/bin/env tsx
// Enrich song lyrics from Genius API
// Run with: pnpm tsx scripts/data-pipeline/enrich-lyrics.ts

import { eq, isNull, or, and } from 'drizzle-orm'
import { songs } from '../../server/database/schema'
import { getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface GeniusReferent {
  _type: string
  annotator_id: number
  annotator_login: string
  api_path: string
  classification: string
  fragment: string
  id: number
  path: string
  range: {
    content: string
  }
  song_id: number
  url: string
  verified_annotator_ids: number[]
  referent: {
    _type: string
    api_path: string
    context: string
    id: number
    image_url: string
    title: string
    type: string
    url: string
  }
  annotations: Array<{
    _type: string
    api_path: string
    body: {
      dom: {
        tag: string
        children: any[]
      }
    }
    comment_count: number
    community: boolean
    custom_preview: boolean
    has_voters: boolean
    id: number
    pinned: boolean
    source: string
    state: string
    url: string
    verified: boolean
    votes_total: number
    current_user_metadata: any
  }>
}

interface GeniusSongResponse {
  response: {
    song: {
      id: number
      title: string
      url: string
      path: string
      lyrics_state: string
      description?: {
        dom: {
          tag: string
          children: any[]
        }
      }
    }
  }
}

// Function to extract text from Genius DOM structure
function extractTextFromDOM(dom: any): string {
  if (typeof dom === 'string') return dom
  if (!dom || !dom.children) return ''
  
  let text = ''
  for (const child of dom.children) {
    if (typeof child === 'string') {
      text += child
    } else if (child.tag === 'br') {
      text += '\n'
    } else if (child.tag === 'p' || child.tag === 'div') {
      text += extractTextFromDOM(child) + '\n\n'
    } else {
      text += extractTextFromDOM(child)
    }
  }
  
  return text.trim()
}

// Fetch song details and lyrics from Genius API
async function fetchSongLyrics(token: string, songId: string): Promise<string | null> {
  try {
    // Get song details first
    const songResponse = await fetch(
      `https://api.genius.com/songs/${songId}?text_format=plain`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (!songResponse.ok) {
      throw new Error(`Song API error: ${songResponse.status}`)
    }
    
    const songData: GeniusSongResponse = await songResponse.json()
    
    // Check if the song has lyrics
    if (songData.response.song.lyrics_state !== 'complete') {
      console.log(`   Lyrics state: ${songData.response.song.lyrics_state}`)
      return null
    }
    
    // Get referents with text_format=plain to get actual text content
    const referentsResponse = await fetch(
      `https://api.genius.com/referents?song_id=${songId}&text_format=plain&per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (!referentsResponse.ok) {
      throw new Error(`Referents API error: ${referentsResponse.status}`)
    }
    
    const referentsData = await referentsResponse.json()
    const referents: GeniusReferent[] = referentsData.response.referents || []
    
    // The referents contain annotated sections of the lyrics
    // We need to get the full lyrics from the song's DOM description
    // or piece together from referents
    
    if (referents.length > 0) {
      console.log(`   Found ${referents.length} referents (annotated sections)`)
      
      // Extract the lyric fragments
      const fragments = referents
        .map(r => r.range.content)
        .filter(content => content && content.trim())
      
      // Note: This only gives us annotated parts, not the full lyrics
      // The Genius API doesn't provide a direct endpoint for full lyrics
      // They expect you to either:
      // 1. Use the embed widget
      // 2. Parse the DOM from song.description (if available)
      // 3. Use web scraping (which requires additional permissions)
      
      if (songData.response.song.description?.dom) {
        // Try to extract from description DOM if available
        const descriptionText = extractTextFromDOM(songData.response.song.description.dom)
        if (descriptionText && descriptionText.length > 100) {
          return descriptionText
        }
      }
      
      // Return fragments joined together (partial lyrics)
      if (fragments.length > 5) {
        return fragments.join('\\n\\n')
      }
    }
    
    // The Genius API doesn't provide full lyrics directly
    // You need to either use their embed widget or web scraping
    console.log('   Note: Genius API does not provide full lyrics directly')
    return null
    
  } catch (error) {
    console.error(`Error fetching lyrics for song ${songId}:`, error)
    return null
  }
}

async function main() {
  const token = process.env.GENIUS_API_CLIENT_ACCESS_TOKEN || process.env.GENIUS_ACCESS_TOKEN
  
  if (!token) {
    console.error('❌ GENIUS_API_CLIENT_ACCESS_TOKEN not found in environment variables')
    process.exit(1)
  }
  
  console.log('🎶 Starting lyrics enrichment from Genius...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(500) // 2 requests per second
  
  // Get songs that have Genius IDs but no lyrics
  const songsToEnrich = await db.select()
    .from(songs)
    .where(
      and(
        or(isNull(songs.lyrics), eq(songs.lyrics, '')),
        or(
          and(
            isNull(songs.geniusSongId),
            isNull(songs.geniusSongId)
          ),
          songs.geniusSongId
        )
      )
    )
    .limit(10) // Start with just 10 songs
    .all()
  
  // Filter for songs with Genius IDs
  const songsWithGeniusId = songsToEnrich.filter(s => s.geniusSongId)
  
  console.log(`Found ${songsWithGeniusId.length} songs with Genius IDs to process`)
  
  const progress: EnrichmentProgress = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const song of songsWithGeniusId) {
    progress.processed++
    
    try {
      await rateLimiter.throttle()
      
      console.log(`\n🎵 Processing "${song.title}"...`)
      
      const lyrics = await fetchSongLyrics(token, song.geniusSongId!)
      
      if (lyrics && lyrics.length > 50) { // Ensure we have substantial lyrics
        // Update song with lyrics
        await db.update(songs)
          .set({
            lyrics,
            updatedAt: new Date()
          })
          .where(eq(songs.id, song.id))
        
        progress.updated++
        console.log(`✅ Added ${lyrics.split('\n').length} lines of lyrics`)
      } else {
        progress.skipped++
        console.log(`⏭️  No lyrics found or lyrics too short`)
      }
      
    } catch (error) {
      progress.failed++
      console.error(`❌ Error:`, error)
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
  console.log('\n✨ Lyrics enrichment complete!')
}

// Run the enrichment
main().catch(console.error)