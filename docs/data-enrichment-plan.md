# Data Enrichment Plan for Daft.fm

## Current State Analysis

### Existing Entities
1. **Artists** - Basic info (name, country, year, bio, genres, images)
2. **Albums** - Basic info (title, artist, release date, track count, cover art)
3. **Songs** - Basic info (title, artist, album, duration, lyrics, annotations)

### Missing Data & Opportunities

## 1. Track-Level Credits (Discogs Model)
Create a comprehensive credits system for each track:

### New Entity: `song_credits`
- songId (FK to songs)
- personId (FK to new `people` table)
- role (e.g., "Bass", "Drums", "Vocals", "Producer", "Mixing Engineer")
- instruments (JSON array for multiple instruments)
- notes (e.g., "Solo on track 3:45-4:12")

### New Entity: `people`
- id
- name
- slug
- roles (JSON array: ["musician", "producer", "engineer"])
- primaryInstruments
- bio
- images
- externalIds

## 2. Musical Connections (WhoSampled Model)

### New Entity: `song_connections`
- sourceSongId
- targetSongId
- connectionType: "sample" | "cover" | "remix" | "interpolation" | "live_version"
- details (JSON):
  - timings (e.g., "0:45-1:02 sampled at 2:15-2:32")
  - elements (e.g., ["drums", "bassline", "vocal"])
  - notes

### New Entity: `samples`
- songId
- sampledSongId
- startTime / endTime
- sampledStartTime / sampledEndTime
- description
- verified (boolean)

## 3. Genre System (RateYourMusic Model)

### New Entity: `genres`
- id
- name
- slug
- parentGenreId (for hierarchical genres)
- description
- characteristics
- yearOriginated
- geographicOrigin

### New Entity: `artist_genres` / `album_genres` / `song_genres`
- entityId
- genreId
- isPrimary (boolean)
- confidence (0-1)

## 4. Enhanced Song Data

### Augment `songs` table:
- key (musical key, e.g., "C major")
- tempo (BPM)
- timeSignature
- energy (0-1)
- danceability (0-1)
- acousticness (0-1)
- instrumentalness (0-1)
- liveness (0-1)
- valence (0-1) // positivity
- loudness (dB)

### New Entity: `song_sections`
- songId
- sectionType: "intro" | "verse" | "chorus" | "bridge" | "outro" | "solo"
- startTime
- endTime
- lyrics (for that section)
- notes

## 5. Release Variations

### New Entity: `releases`
- id
- albumId (FK to albums)
- format: "CD" | "Vinyl" | "Digital" | "Cassette"
- country
- releaseDate
- label
- catalogNumber
- barcode
- notes (e.g., "Limited Edition", "Remastered")

### New Entity: `release_tracks`
- releaseId
- songId
- trackNumber
- discNumber
- duration (might differ by release)
- isBonus (boolean)

## 6. User-Generated Content

### New Entity: `annotations`
- entityType: "song" | "album" | "artist"
- entityId
- userId
- startChar / endChar (for highlighting specific lyrics)
- annotation (markdown)
- upvotes / downvotes
- verifiedBy (for fact-checking)

### New Entity: `trivia`
- entityType & entityId
- fact
- source
- category: "recording" | "inspiration" | "cultural_impact" | "technical"
- verified

## 7. Live Performance Data

### New Entity: `performances`
- songId
- artistId
- venueId
- date
- tourId
- setlistPosition
- notes (e.g., "acoustic version", "extended outro")
- recordingUrl

### New Entity: `venues`
- id
- name
- city
- country
- capacity
- coordinates

### New Entity: `tours`
- id
- artistId
- name
- startDate
- endDate
- legCount

## 8. Collaboration Network

### New Entity: `collaborations`
- artist1Id
- artist2Id
- collaborationType: "featured" | "band_member" | "producer" | "writer"
- startDate
- endDate
- projectCount

## 9. Chart History

### New Entity: `chart_positions`
- entityType: "song" | "album"
- entityId
- chartId
- position
- weekDate
- weeksOnChart

### New Entity: `charts`
- id
- name (e.g., "Billboard Hot 100")
- country
- chartType: "sales" | "airplay" | "streaming" | "combined"

## 10. Media & Press

### New Entity: `reviews`
- entityType & entityId
- source (e.g., "Pitchfork", "NME")
- rating
- reviewText
- reviewDate
- reviewerName
- url

### New Entity: `awards`
- entityType & entityId
- awardName
- category
- year
- result: "won" | "nominated"

## Implementation Priority

### Phase 1: Core Enrichment
1. Track-level credits system
2. Enhanced genre system
3. Song musical attributes (key, tempo, etc.)

### Phase 2: Connections & Relationships
1. Sample/cover/remix connections
2. Collaboration network
3. Live performance data

### Phase 3: User & External Content
1. Annotations system
2. Chart history
3. Reviews & awards

## Data Sources

### APIs to Integrate:
1. **Spotify API** - Audio features, popularity metrics
2. **Genius API** - Lyrics, annotations, artist bios
3. **Last.fm API** - Tags, similar artists, play counts
4. **Discogs API** - Detailed credits, release variations
5. **MusicBrainz API** - Comprehensive metadata
6. **Setlist.fm API** - Live performance data
7. **TheAudioDB** - Additional metadata, images

### Scraping Targets:
1. **WhoSampled** - Sample connections
2. **RateYourMusic** - Genre descriptions, user lists
3. **AllMusic** - Credits, reviews, biography

## Database Impact

This enrichment would transform our simple 3-table database into a comprehensive music knowledge graph with 20+ interconnected tables, enabling:

- Deep musical genealogy tracking
- Comprehensive credit attribution
- Rich discovery features
- Cultural context and impact tracking
- Live performance history
- Detailed technical analysis

Each page would go from showing basic info to becoming a rich, interconnected hub of musical knowledge.