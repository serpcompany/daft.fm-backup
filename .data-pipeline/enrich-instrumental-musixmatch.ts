#!/usr/bin/env tsx
// Enrich songs with instrumental status from Musixmatch API

import Database from 'better-sqlite3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../../.env') })

const DB_PATH = '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite'

interface Song {
  id: string
  title: string
  artist_name?: string
  isrc?: string
  is_instrumental: number
}

interface MusixmatchTrackResponse {
  message: {
    header: {
      status_code: number
    }
    body: {
      track: {
        track_id: number
        track_name: string
        instrumental: number  // 0 = not instrumental, 1 = instrumental
        has_lyrics: number    // 0 = no lyrics, 1 = has lyrics
      }
    }
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchTrackOnMusixmatch(apiKey: string, title: string, artist: string, isrc?: string): Promise<boolean | null> {
  try {
    // Musixmatch prefers ISRC for accurate matching
    let url = `https://api.musixmatch.com/ws/1.1/track.search?apikey=${apiKey}&format=json&page_size=1`
    
    if (isrc && isrc.length > 0) {
      // Search by ISRC for most accurate match
      url += `&track_isrc=${encodeURIComponent(isrc)}`
    } else {
      // Search by title and artist
      url += `&q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}`
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`   ❌ Musixmatch API error: ${response.status}`)
      return null
    }
    
    const data = await response.json() as any
    
    // Check if we got results
    if (data.message.header.status_code !== 200 || !data.message.body.track_list || data.message.body.track_list.length === 0) {
      console.log(`   ⚠️  No match found on Musixmatch`)
      return null
    }
    
    const track = data.message.body.track_list[0].track
    
    // Check instrumental flag
    const isInstrumental = track.instrumental === 1
    const hasLyrics = track.has_lyrics === 1
    
    console.log(`   ✓ Found on Musixmatch: instrumental=${track.instrumental}, has_lyrics=${track.has_lyrics}`)
    
    // A track is instrumental if the flag is set OR if it has no lyrics
    return isInstrumental || !hasLyrics
    
  } catch (error) {
    console.error(`   ❌ Error searching Musixmatch: ${error}`)
    return null
  }
}

async function main() {
  const apiKey = process.env.MUSIXMATCH_API_KEY
  
  if (!apiKey) {
    console.error('❌ MUSIXMATCH_API_KEY not found in environment variables')
    process.exit(1)
  }
  
  console.log('🎵 Starting instrumental status enrichment using Musixmatch...\n')
  
  const db = new Database(DB_PATH)
  
  // Get all songs with artist info
  const songs = db.prepare(`
    SELECT s.id, s.title, s.isrc, s.is_instrumental,
           a.name as artist_name
    FROM songs s
    JOIN artists a ON s.artist_id = a.id
    WHERE s.is_instrumental = 0
    ORDER BY a.name, s.title
  `).all() as Song[]
  
  console.log(`Found ${songs.length} songs to check\n`)
  
  let stats = {
    processed: 0,
    instrumental: 0,
    notInstrumental: 0,
    notFound: 0,
    errors: 0
  }
  
  for (const song of songs) {
    stats.processed++
    console.log(`🎵 Checking "${song.title}" by ${song.artist_name}...`)
    
    // Rate limiting - Musixmatch has different limits per plan
    await delay(500) // 2 requests per second to be safe
    
    try {
      const isInstrumental = await searchTrackOnMusixmatch(
        apiKey, 
        song.title, 
        song.artist_name || '',
        song.isrc || undefined
      )
      
      if (isInstrumental === null) {
        stats.notFound++
      } else if (isInstrumental) {
        // Update database
        db.prepare(`
          UPDATE songs 
          SET is_instrumental = 1, updated_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), song.id)
        
        stats.instrumental++
        console.log(`   ✅ Marked as instrumental`)
      } else {
        stats.notInstrumental++
        console.log(`   ✅ Confirmed as non-instrumental`)
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing song: ${error}`)
      stats.errors++
    }
    
    // Progress report every 10 songs
    if (stats.processed % 10 === 0) {
      console.log(`\n📊 Progress: ${stats.processed}/${songs.length} (${Math.round(stats.processed * 100 / songs.length)}%)`)
      console.log(`   Instrumental: ${stats.instrumental}, Not instrumental: ${stats.notInstrumental}`)
      console.log(`   Not found: ${stats.notFound}, Errors: ${stats.errors}\n`)
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL REPORT')
  console.log('='.repeat(50))
  console.log(`Total processed: ${stats.processed}`)
  console.log(`✅ Instrumental: ${stats.instrumental} (${Math.round(stats.instrumental * 100 / stats.processed)}%)`)
  console.log(`✅ Not instrumental: ${stats.notInstrumental} (${Math.round(stats.notInstrumental * 100 / stats.processed)}%)`)
  console.log(`⚠️  Not found: ${stats.notFound} (${Math.round(stats.notFound * 100 / stats.processed)}%)`)
  console.log(`❌ Errors: ${stats.errors}`)
  
  db.close()
  console.log('\n✨ Instrumental status enrichment complete!')
}

main().catch(console.error)