# Immediate Data Enrichment Tasks

## Quick Wins (Can implement now with existing schema)

### 1. Populate Empty Fields
Current schema has these fields that are often empty:
- `songs.lyrics` - Get from Genius API
- `songs.annotations` - Get from Genius API
- `artists.bio` - Get from Discogs/Wikipedia
- `artists.images` - Get from multiple sources
- `albums.coverArt` - Get from MusicBrainz/Spotify

### 2. Fill External IDs
We have `externalIds` JSON fields that can store:
```json
{
  "spotify_id": "...",
  "genius_id": "...",
  "discogs_id": "...",
  "lastfm_id": "...",
  "youtube_id": "...",
  "apple_music_id": "..."
}
```

### 3. Enrich Genres
The `artists.genres` field can be expanded from simple arrays to rich objects:
```json
[
  {
    "name": "Electronic",
    "weight": 0.8,
    "source": "spotify"
  },
  {
    "name": "French House",
    "weight": 0.9,
    "source": "lastfm"
  }
]
```

## Next Schema Additions (Minimal changes)

### 1. Add Producer Credits to Songs
Add field to `songs` table:
- `producers` TEXT (JSON array of producer names)
- `writers` TEXT (JSON array of writer names)

### 2. Add Track Numbers
Add field to `songs` table:
- `trackNumber` INTEGER
- `discNumber` INTEGER

### 3. Add Labels to Albums
Add field to `albums` table:
- `label` TEXT
- `catalogNumber` TEXT

## API Integration Priority

### 1. Genius API (Immediate)
- **What we get**: Lyrics, annotations, artist bios, song descriptions
- **Implementation**: Create `/server/lib/genius.ts`
- **Rate limits**: 100 requests/hour (free tier)

### 2. Spotify API (Quick setup)
- **What we get**: Audio features, popularity, cover art, artist images
- **Implementation**: Create `/server/lib/spotify.ts`
- **Rate limits**: Very generous with client credentials

### 3. MusicBrainz (Already have IDs)
- **What we get**: Complete discographies, credits, release dates
- **Implementation**: Extend existing integration
- **Rate limits**: 1 request/second

## Data Collection Script Structure

```typescript
// /scripts/enrich-data.ts
async function enrichArtists() {
  const artists = await db.select().from(artists).limit(10)
  
  for (const artist of artists) {
    // 1. Get Spotify data
    const spotifyData = await getSpotifyArtist(artist.name)
    
    // 2. Get Genius data
    const geniusData = await getGeniusArtist(artist.name)
    
    // 3. Merge and update
    await db.update(artists).set({
      images: JSON.stringify([...spotifyImages, ...geniusImages]),
      bio: geniusData.bio || artist.bio,
      externalIds: JSON.stringify({
        ...existingIds,
        spotify_id: spotifyData.id,
        genius_id: geniusData.id
      })
    }).where(eq(artists.id, artist.id))
  }
}
```

## Immediate Impact on Pages

### Song Page Improvements:
- ✅ Lyrics display (from Genius)
- ✅ Annotations on hover (from Genius)
- Producer/writer credits
- Audio features visualization (energy, danceability, etc.)
- "Songs that sample this" section
- "Cover versions" section

### Artist Page Improvements:
- Full biography (from multiple sources)
- Image gallery
- "Similar Artists" section
- Timeline of releases
- Popular songs with play counts

### Album Page Improvements:
- High-res cover art
- Track-by-track credits
- Album reviews/ratings
- Different release versions
- Recording studio info

## Phase 1 Implementation Plan (This Week)

1. **Day 1-2**: Set up API clients
   - Genius API integration
   - Spotify API integration
   - Create rate limiter utility

2. **Day 3-4**: Create enrichment scripts
   - Artist enrichment (images, bios)
   - Album enrichment (cover art, labels)
   - Song enrichment (lyrics, features)

3. **Day 5-6**: Update frontend
   - Display lyrics with annotation highlights
   - Show audio features as charts
   - Add image galleries

4. **Day 7**: Create ongoing sync job
   - Cloudflare scheduled worker
   - Incremental updates
   - Error handling and retries

This gives us immediate visible improvements while we plan the larger schema changes!