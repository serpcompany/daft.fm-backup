# Data Collection Strategy

- Initial Collection: Fetch top 100 artists by popularity from MusicBrainz
- Data Enrichment: Add missing data from complementary sources

 ## STEPS 1: GET DATA

1. Get Artists by Priority by External Relationship Count
2. For Each Artist: Get Albums (Get Canonical Release Pick earliest official release (avoid bootlegs/promos)
   - Skip non-album types
   - skip singles
   - skip compilations
   - etc.
3. For Each Album: Get Songs
4. Extract External IDs From relationship URLs in each entity, extract:
   - Discogs IDs, Genius IDs, Spotify IDs, Wikidata Q-numbers
   - Store for future cross-platform data enrichment

## STEPS 2: QC

- Does it look right?

After running on 100, we only had 77 artists with 335 albums (clearly wrong) 

...and these fields were missing:

Artists (all 75 missing):

- ❌ bio - Artist biographies
- ❌ images - Artist photos
- ❌ members - Band member names

Albums (all 355 missing):

- ❌ cover_art - Album artwork
- ❌ credits - Producer, engineer credits
- ❌ wikidata_id - Wikidata identifiers

Songs (all 4,142 missing):

- ❌ lyrics - Song lyrics
- ❌ annotations - Lyric explanations
- ❌ credits - Writer, producer credits
- ❌ isrc - International recording codes
- ❌ wikidata_id - Wikidata identifiers

## Data Enrichment Sources

### APIs for Additional Data:
1. **Last.fm API** (✅ Configured) - Artist bios, images, tags
2. **Genius API** (✅ Configured) - Lyrics, song credits, annotations  
3. **Discogs API** (✅ Configured) - Detailed album/song credits
4. **Spotify API** (✅ Configured) - Audio features, popularity
5. **MusicBrainz API** (✅ Using) - Core metadata
6. **Cover Art Archive** (✅ Using) - Album artwork
7. **Wikipedia/Wikidata** (Free) - Artist bios, band members
8. **SecondHandSongs API** (New) - Cover versions, samples, adaptations
   - https://secondhandsongs.com/page/API
   - Provides data on song relationships (covers, samples, etc.)
   - Requires API key
