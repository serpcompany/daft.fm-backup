#!/usr/bin/env tsx
// Search for MusicBrainz IDs for our albums
// Run with: pnpm tsx scripts/search-musicbrainz.ts

import { searchArtists, getArtistReleaseGroups } from '../server/lib/musicbrainz'

const ARTISTS_TO_SEARCH = [
  { name: 'Daft Punk', albums: ['Discovery', 'Random Access Memories'] },
  { name: 'Justice', albums: ['Cross', 'Woman'] },
  { name: 'Moderat', albums: ['Moderat'] }
]

async function searchForAlbums() {
  console.log('🔍 Searching MusicBrainz for album IDs...\n')
  
  for (const artistInfo of ARTISTS_TO_SEARCH) {
    console.log(`\n🎤 Searching for ${artistInfo.name}...`)
    
    try {
      // Search for artist
      const artistResults = await searchArtists(artistInfo.name, 5)
      
      if (artistResults.artists.length === 0) {
        console.log(`  ❌ No artists found`)
        continue
      }
      
      // Usually the first result is the best match
      const artist = artistResults.artists[0]
      console.log(`  ✓ Found artist: ${artist.name} (${artist.id})`)
      
      // Get release groups (albums)
      const releaseGroups = await getArtistReleaseGroups(artist.id, 100)
      console.log(`  ✓ Found ${releaseGroups['release-groups'].length} release groups`)
      
      // Match our albums
      for (const albumName of artistInfo.albums) {
        const matches = releaseGroups['release-groups'].filter(rg => 
          rg.title.toLowerCase() === albumName.toLowerCase() ||
          rg.title.toLowerCase().includes(albumName.toLowerCase())
        )
        
        if (matches.length > 0) {
          console.log(`\n  📀 ${albumName}:`)
          matches.forEach(match => {
            console.log(`     - "${match.title}" (${match.id}) [${match['primary-type'] || 'Unknown'}]`)
          })
        } else {
          console.log(`  ⚠️  No match found for "${albumName}"`)
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error searching for ${artistInfo.name}:`, error)
    }
  }
}

searchForAlbums().catch(console.error)