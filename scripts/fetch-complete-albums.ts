#!/usr/bin/env tsx
// Script to fetch complete album track listings from MusicBrainz
// Run with: pnpm tsx scripts/fetch-complete-albums.ts

import { 
  getReleaseGroup, 
  getReleaseGroupReleases, 
  createSlug 
} from '../server/lib/musicbrainz'

// Map our fake IDs to real MusicBrainz IDs
const ALBUM_MAPPINGS = {
  // Daft Punk
  'Discovery': '48117b90-a16e-34ca-a514-19c702df1158',
  'Random Access Memories': 'aa997ea0-2936-40bd-884d-3af8a0e064dc',
  // Justice - Note: Their album "†" is called "✝" (U+271D) in MusicBrainz
  '†': '867d4882-4e8e-3acd-8134-66f19bcca915',
  'Woman': 'e295b8f2-a86c-49fb-8668-aaba1c9f9e4a',
  // Moderat
  'Moderat': '6b3cd75d-7453-39f3-86c4-1441f360e121'
}

async function fetchCompleteAlbumData() {
  console.log('🎵 Fetching complete album data from MusicBrainz...\n')
  
  const sqlStatements: string[] = []
  
  for (const [albumName, releaseGroupId] of Object.entries(ALBUM_MAPPINGS)) {
    console.log(`\n📀 Fetching ${albumName}...`)
    
    try {
      // Get release group info
      const releaseGroup = await getReleaseGroup(releaseGroupId)
      
      // Get releases (actual albums with track listings)
      const releases = await getReleaseGroupReleases(releaseGroupId)
      
      if (releases.releases.length === 0) {
        console.log(`  ⚠️  No releases found for ${albumName}`)
        continue
      }
      
      // Use the first release (usually the original)
      const release = releases.releases[0]
      console.log(`  ✓ Found release: ${release.title}`)
      
      // Get tracks from all media (CDs, vinyl, etc)
      let allTracks: any[] = []
      if (release.media) {
        for (const medium of release.media) {
          if (medium.tracks) {
            allTracks = allTracks.concat(medium.tracks)
          }
        }
      }
      
      console.log(`  ✓ Found ${allTracks.length} tracks`)
      
      // Generate SQL for missing tracks
      for (const track of allTracks) {
        const songId = track.recording.id
        const songTitle = track.recording.title
        const songSlug = createSlug(songTitle)
        const duration = track.recording.length ? Math.floor(track.recording.length / 1000) : null
        
        // We'll need to map to our existing artist and album IDs
        const artistId = getArtistId(albumName)
        const albumId = getAlbumId(albumName)
        
        sqlStatements.push(
          `-- ${albumName} - Track ${track.position}: ${songTitle}
('${songId}', '${songTitle.replace(/'/g, "''")}', '${songSlug}', ${duration}, '${artistId}', '${albumId}', null, null, null, null, null, '{}', 1721826000, 1721826000)`
        )
      }
      
    } catch (error) {
      console.error(`  ❌ Error fetching ${albumName}:`, error)
    }
  }
  
  // Output SQL statements
  console.log('\n\n-- Additional songs to complete albums:')
  console.log('INSERT INTO songs (id, title, slug, duration, artist_id, album_id, release_date, lyrics, annotations, isrc, wikidata_id, external_ids, created_at, updated_at) VALUES')
  console.log(sqlStatements.join(',\n') + ';')
}

// Helper functions to map album names to our IDs
function getArtistId(albumName: string): string {
  const mapping: Record<string, string> = {
    'Discovery': '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    'Random Access Memories': '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    '†': 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd',
    'Woman': 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd',
    'Moderat': '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b'
  }
  return mapping[albumName] || ''
}

function getAlbumId(albumName: string): string {
  const mapping: Record<string, string> = {
    'Discovery': '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c',
    'Random Access Memories': 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    '†': 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
    'Woman': 'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
    'Moderat': 'd4e5f6g7-h8i9-0123-4567-890123defghi'
  }
  return mapping[albumName] || ''
}

// Run the script
fetchCompleteAlbumData().catch(console.error)