#!/usr/bin/env tsx
// Enrich songs with instrumental status from MusicBrainz and title analysis

import Database from 'better-sqlite3'

const DB_PATH = '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite'

interface Song {
  id: string
  title: string
  musicbrainz_recording_id?: string
  genius_song_id?: string
  lyrics?: string
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkMusicBrainzInstrumental(recordingId: string): Promise<boolean | null> {
  try {
    await delay(1000) // Rate limiting for MusicBrainz
    
    const response = await fetch(
      `https://musicbrainz.org/ws/2/recording/${recordingId}?inc=tags&fmt=json`,
      {
        headers: {
          'User-Agent': 'daft.fm/1.0 (https://daft.fm)'
        }
      }
    )
    
    if (!response.ok) {
      console.error(`   ❌ MusicBrainz error: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    // Check tags for instrumental indicators
    if (data.tags) {
      const instrumentalTags = data.tags.filter((tag: any) => 
        tag.name.toLowerCase().includes('instrumental') ||
        tag.name.toLowerCase() === 'no vocals'
      )
      
      if (instrumentalTags.length > 0) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error(`   ❌ Error checking MusicBrainz: ${error}`)
    return null
  }
}

function isLikelyInstrumental(title: string): boolean {
  const instrumentalIndicators = [
    /\binstrumental\b/i,
    /\(instrumental\)/i,
    /\[instrumental\]/i,
    /- instrumental$/i,
    /^instrumental -/i,
    /\bkaraoke\b/i,
    /\(karaoke\)/i,
    /\bplayback\b/i,
    /\bbacking track\b/i,
    /\(no vocals?\)/i,
    /\binterlude\b/i,
    /\bprelude\b/i,
    /\boutro\b/i,
    /\bintro\b/i
  ]
  
  return instrumentalIndicators.some(pattern => pattern.test(title))
}

async function main() {
  console.log('🎵 Starting instrumental status enrichment...\n')
  
  const db = new Database(DB_PATH)
  
  // Get all songs
  const songs = db.prepare(`
    SELECT id, title, musicbrainz_recording_id, genius_song_id, lyrics
    FROM songs
  `).all() as Song[]
  
  console.log(`Found ${songs.length} songs to analyze\n`)
  
  let stats = {
    processed: 0,
    instrumental: 0,
    notInstrumental: 0,
    uncertain: 0
  }
  
  for (const song of songs) {
    stats.processed++
    console.log(`🎵 Processing "${song.title}"...`)
    
    let isInstrumental = false
    let confidence = 'low'
    
    // 1. Check if title suggests instrumental
    if (isLikelyInstrumental(song.title)) {
      isInstrumental = true
      confidence = 'title'
      console.log('   ✓ Title suggests instrumental')
    }
    
    // 2. Check MusicBrainz tags if we have an ID (skip if already has lyrics)
    if (song.musicbrainz_recording_id && !isInstrumental && !song.lyrics) {
      const mbResult = await checkMusicBrainzInstrumental(song.musicbrainz_recording_id)
      if (mbResult === true) {
        isInstrumental = true
        confidence = 'musicbrainz'
        console.log('   ✓ MusicBrainz tags confirm instrumental')
      }
    }
    
    // 3. If we have lyrics, it's definitely not instrumental
    if (song.lyrics && song.lyrics.length > 50) {
      if (isInstrumental) {
        console.log('   ⚠️  Has lyrics but was marked instrumental - keeping as non-instrumental')
      }
      isInstrumental = false
      confidence = 'has_lyrics'
    }
    
    // 4. Update database
    if (isInstrumental) {
      db.prepare(`
        UPDATE songs 
        SET is_instrumental = 1, updated_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), song.id)
      
      stats.instrumental++
      console.log(`   ✅ Marked as instrumental (${confidence})`)
    } else if (confidence === 'has_lyrics' || confidence === 'musicbrainz') {
      // We're confident it's not instrumental
      db.prepare(`
        UPDATE songs 
        SET is_instrumental = 0, updated_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), song.id)
      
      stats.notInstrumental++
      console.log(`   ✅ Marked as non-instrumental (${confidence})`)
    } else {
      stats.uncertain++
      console.log('   ⏭️  Cannot determine - leaving as default (not instrumental)')
    }
    
    // Progress report every 10 songs
    if (stats.processed % 10 === 0) {
      console.log(`\n📊 Progress: ${stats.processed}/${songs.length} (${Math.round(stats.processed * 100 / songs.length)}%)`)
      console.log(`   Instrumental: ${stats.instrumental}, Not instrumental: ${stats.notInstrumental}, Uncertain: ${stats.uncertain}\n`)
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL REPORT')
  console.log('='.repeat(50))
  console.log(`Total processed: ${stats.processed}`)
  console.log(`✅ Instrumental: ${stats.instrumental} (${Math.round(stats.instrumental * 100 / stats.processed)}%)`)
  console.log(`✅ Not instrumental: ${stats.notInstrumental} (${Math.round(stats.notInstrumental * 100 / stats.processed)}%)`)
  console.log(`❓ Uncertain: ${stats.uncertain} (${Math.round(stats.uncertain * 100 / stats.processed)}%)`)
  
  db.close()
  console.log('\n✨ Instrumental status enrichment complete!')
}

main().catch(console.error)