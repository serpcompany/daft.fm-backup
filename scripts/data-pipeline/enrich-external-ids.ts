#!/usr/bin/env tsx
// Enrich external IDs and lyric links from MusicBrainz relationships
// Run with: pnpm tsx scripts/data-pipeline/enrich-external-ids.ts

import { eq } from 'drizzle-orm'
import { songs, albums, artists } from '../../server/database/schema'
import { getLocalDatabase, RateLimiter, type EnrichmentProgress } from './enrichment'

async function fetchRecordingRelationships(recordingId: string): Promise<any> {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/recording/${recordingId}?inc=url-rels&fmt=json`,
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
    return data.relations || []
  } catch (error) {
    console.error(`Error fetching relationships for recording ${recordingId}:`, error)
    return []
  }
}

async function fetchReleaseRelationships(releaseId: string): Promise<any> {
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/release-group/${releaseId}?inc=url-rels&fmt=json`,
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
    return data.relations || []
  } catch (error) {
    console.error(`Error fetching relationships for release ${releaseId}:`, error)
    return []
  }
}

function extractIdentifiers(relations: any[]): Record<string, any> {
  const ids: Record<string, any> = {}
  
  for (const rel of relations) {
    if (!rel.url?.resource) continue
    
    const url = rel.url.resource
    
    // Lyrics sites
    if (url.includes('lyrics.wikia.com') || url.includes('lyricfind.com') || url.includes('muzikum.eu')) {
      if (!ids.lyrics_urls) ids.lyrics_urls = []
      ids.lyrics_urls.push(url)
    }
    
    // Streaming services
    else if (url.includes('spotify.com/track/')) {
      ids.spotify_track_id = url.split('spotify.com/track/')[1]
    } else if (url.includes('spotify.com/album/')) {
      ids.spotify_album_id = url.split('spotify.com/album/')[1]
    } else if (url.includes('music.apple.com')) {
      ids.apple_music_url = url
    } else if (url.includes('soundcloud.com')) {
      ids.soundcloud_url = url
    } else if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      ids.youtube_url = url
    }
    
    // Purchase/info sites
    else if (url.includes('discogs.com/release/')) {
      ids.discogs_release_id = url.match(/discogs\.com\/release\/(\d+)/)?.[1]
    } else if (url.includes('discogs.com/master/')) {
      ids.discogs_master_id = url.match(/discogs\.com\/master\/(\d+)/)?.[1]
    } else if (url.includes('allmusic.com')) {
      ids.allmusic_url = url
    } else if (url.includes('rateyourmusic.com')) {
      ids.rym_url = url
    } else if (url.includes('bandcamp.com')) {
      ids.bandcamp_url = url
    }
    
    // Other identifiers
    else if (url.includes('viaf.org')) {
      ids.viaf_id = url.split('viaf.org/viaf/')[1]
    } else if (url.includes('catalogue.bnf.fr')) {
      ids.bnf_id = url.match(/catalogue\.bnf\.fr\/ark:\/\d+\/(\w+)/)?.[1]
    }
  }
  
  return ids
}

async function main() {
  console.log('🌐 Starting external IDs enrichment from MusicBrainz...\n')
  
  const db = getLocalDatabase()
  const rateLimiter = new RateLimiter(1000) // 1 request per second (MusicBrainz rate limit)
  
  console.log('🎵 Processing songs...')
  
  // Get first 30 songs with MusicBrainz IDs
  const songsToProcess = await db.select()
    .from(songs)
    .limit(30)
    .all()
  
  const songsWithMbid = songsToProcess.filter(s => s.musicbrainzId && s.musicbrainzId.match(/^[0-9a-f-]{36}$/))
  
  console.log(`Found ${songsWithMbid.length} songs to process\n`)
  
  let updatedCount = 0
  
  for (const song of songsWithMbid) {
    await rateLimiter.throttle()
    
    const relations = await fetchRecordingRelationships(song.musicbrainzId!)
    const newIds = extractIdentifiers(relations)
    
    if (Object.keys(newIds).length > 0) {
      // Merge with existing external IDs
      let existingIds = {}
      try {
        if (song.externalIds && song.externalIds !== '{}') {
          existingIds = JSON.parse(song.externalIds)
        }
      } catch (e) {}
      
      const mergedIds = { ...existingIds, ...newIds }
      
      // Update specific ID fields if found
      const updates: any = {
        externalIds: JSON.stringify(mergedIds),
        updatedAt: new Date()
      }
      
      if (newIds.spotify_track_id && !song.spotifyTrackId) {
        updates.spotifyTrackId = newIds.spotify_track_id
      }
      
      await db.update(songs)
        .set(updates)
        .where(eq(songs.id, song.id))
      
      updatedCount++
      console.log(`✅ "${song.title}" - Added ${Object.keys(newIds).length} identifier(s)`)
      
      if (newIds.lyrics_urls) {
        console.log(`   🎶 Found lyrics: ${newIds.lyrics_urls.join(', ')}`)
      }
    }
  }
  
  console.log('\n💿 Processing albums...')
  
  // Get first 10 albums with MusicBrainz IDs
  const albumsToProcess = await db.select()
    .from(albums)
    .limit(10)
    .all()
  
  const albumsWithMbid = albumsToProcess.filter(a => a.musicbrainzId && a.musicbrainzId.match(/^[0-9a-f-]{36}$/))
  
  console.log(`Found ${albumsWithMbid.length} albums to process\n`)
  
  let albumsUpdated = 0
  
  for (const album of albumsWithMbid) {
    await rateLimiter.throttle()
    
    const relations = await fetchReleaseRelationships(album.musicbrainzId!)
    const newIds = extractIdentifiers(relations)
    
    if (Object.keys(newIds).length > 0) {
      // Merge with existing external IDs
      let existingIds = {}
      try {
        if (album.externalIds && album.externalIds !== '{}') {
          existingIds = JSON.parse(album.externalIds)
        }
      } catch (e) {}
      
      const mergedIds = { ...existingIds, ...newIds }
      
      // Update specific ID fields if found
      const updates: any = {
        externalIds: JSON.stringify(mergedIds),
        updatedAt: new Date()
      }
      
      if (newIds.spotify_album_id && !album.spotifyAlbumId) {
        updates.spotifyAlbumId = newIds.spotify_album_id
      }
      
      if (newIds.discogs_master_id && !album.discogsMasterId) {
        updates.discogsMasterId = newIds.discogs_master_id
      }
      
      await db.update(albums)
        .set(updates)
        .where(eq(albums.id, album.id))
      
      albumsUpdated++
      console.log(`✅ "${album.title}" - Added ${Object.keys(newIds).length} identifier(s)`)
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL REPORT')
  console.log('='.repeat(50))
  console.log(`Songs updated: ${updatedCount}/${songsWithMbid.length}`)
  console.log(`Albums updated: ${albumsUpdated}/${albumsWithMbid.length}`)
  console.log('\n✨ External IDs enrichment complete!')
}

// Run the enrichment
main().catch(console.error)