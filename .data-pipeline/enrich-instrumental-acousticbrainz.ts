#!/usr/bin/env tsx
// Enrich songs with instrumental status from AcousticBrainz API
// Uses machine learning-based audio analysis

import Database from 'better-sqlite3'

const DB_PATH = '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite'

interface Song {
  id: string
  title: string
  artist_name?: string
  musicbrainz_recording_id?: string
  is_instrumental: number
}

interface AcousticBrainzResponse {
  highlevel?: {
    voice_instrumental?: {
      all: {
        instrumental: number  // Probability 0-1
        voice: number        // Probability 0-1
      }
      probability: number    // Confidence of the classification
      value: 'voice' | 'instrumental'  // The classification
    }
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getAcousticBrainzData(recordingId: string): Promise<{isInstrumental: boolean, confidence: number} | null> {
  try {
    const response = await fetch(`https://acousticbrainz.org/api/v1/${recordingId}/high-level`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // No data for this recording
      }
      console.error(`   ❌ AcousticBrainz API error: ${response.status}`)
      return null
    }
    
    const data = await response.json() as AcousticBrainzResponse
    
    if (data.highlevel?.voice_instrumental) {
      const vi = data.highlevel.voice_instrumental
      const isInstrumental = vi.value === 'instrumental'
      const confidence = vi.probability
      
      console.log(`   ✓ Found on AcousticBrainz: ${vi.value} (confidence: ${(confidence * 100).toFixed(1)}%)`)
      console.log(`     Instrumental: ${(vi.all.instrumental * 100).toFixed(1)}%, Voice: ${(vi.all.voice * 100).toFixed(1)}%`)
      
      return { isInstrumental, confidence }
    }
    
    return null
  } catch (error) {
    console.error(`   ❌ Error fetching from AcousticBrainz: ${error}`)
    return null
  }
}

async function main() {
  console.log('🎵 Starting instrumental status enrichment using AcousticBrainz...')
  console.log('   (Machine learning-based audio analysis)\n')
  
  const db = new Database(DB_PATH)
  
  // Get songs with MusicBrainz recording IDs that haven't been marked as instrumental
  // We'll check even songs already marked to compare with other sources
  const songs = db.prepare(`
    SELECT s.id, s.title, s.musicbrainz_recording_id, s.is_instrumental,
           a.name as artist_name
    FROM songs s
    JOIN artists a ON s.artist_id = a.id
    WHERE s.musicbrainz_recording_id IS NOT NULL 
    AND s.musicbrainz_recording_id != ''
    ORDER BY a.name, s.title
  `).all() as Song[]
  
  console.log(`Found ${songs.length} songs with MusicBrainz IDs to analyze\n`)
  
  let stats = {
    processed: 0,
    instrumental: 0,
    vocal: 0,
    noData: 0,
    errors: 0,
    highConfidence: 0,  // > 80% confidence
    lowConfidence: 0    // < 80% confidence
  }
  
  for (const song of songs) {
    stats.processed++
    console.log(`🎵 Analyzing "${song.title}" by ${song.artist_name}...`)
    
    // Rate limiting - AcousticBrainz is more lenient
    await delay(200) // 5 requests per second
    
    try {
      const result = await getAcousticBrainzData(song.musicbrainz_recording_id!)
      
      if (result === null) {
        stats.noData++
        console.log(`   ⚠️  No acoustic analysis data available`)
      } else {
        if (result.confidence > 0.8) {
          stats.highConfidence++
        } else {
          stats.lowConfidence++
          console.log(`   ⚠️  Low confidence classification`)
        }
        
        if (result.isInstrumental) {
          // Only update if we have high confidence
          if (result.confidence > 0.8 && song.is_instrumental === 0) {
            db.prepare(`
              UPDATE songs 
              SET is_instrumental = 1, updated_at = ?
              WHERE id = ?
            `).run(new Date().toISOString(), song.id)
            
            console.log(`   ✅ Updated to instrumental (high confidence)`)
          }
          stats.instrumental++
        } else {
          stats.vocal++
          if (song.is_instrumental === 1) {
            console.log(`   ⚠️  Conflict: DB says instrumental, AcousticBrainz says vocal`)
          }
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing song: ${error}`)
      stats.errors++
    }
    
    // Progress report every 20 songs
    if (stats.processed % 20 === 0) {
      console.log(`\n📊 Progress: ${stats.processed}/${songs.length} (${Math.round(stats.processed * 100 / songs.length)}%)`)
      console.log(`   Instrumental: ${stats.instrumental}, Vocal: ${stats.vocal}`)
      console.log(`   No data: ${stats.noData}, Errors: ${stats.errors}`)
      console.log(`   High confidence: ${stats.highConfidence}, Low confidence: ${stats.lowConfidence}\n`)
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL REPORT - AcousticBrainz Analysis')
  console.log('='.repeat(50))
  console.log(`Total processed: ${stats.processed}`)
  console.log(`🎸 Instrumental: ${stats.instrumental} (${Math.round(stats.instrumental * 100 / stats.processed)}%)`)
  console.log(`🎤 Vocal: ${stats.vocal} (${Math.round(stats.vocal * 100 / stats.processed)}%)`)
  console.log(`⚠️  No data: ${stats.noData} (${Math.round(stats.noData * 100 / stats.processed)}%)`)
  console.log(`❌ Errors: ${stats.errors}`)
  console.log(`\nConfidence levels:`)
  console.log(`   High (>80%): ${stats.highConfidence}`)
  console.log(`   Low (<80%): ${stats.lowConfidence}`)
  
  db.close()
  console.log('\n✨ AcousticBrainz enrichment complete!')
}

main().catch(console.error)