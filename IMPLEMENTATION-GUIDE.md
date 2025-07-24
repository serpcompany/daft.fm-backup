# daft.fm Implementation Guide

## Data Model

### Artist
- id (MBID - primary key)
- name, country, formed_year, genres, slug
- external_ids: { wikidata_id, freebase_id, discogs_artist_id, genius_artist_id, spotify_artist_id }

### Album  
- id (Release Group MBID - primary key)
- title, artist_id, release_date, track_count, slug
- external_ids: { wikidata_id, freebase_id, discogs_master_id, genius_album_id, spotify_album_id }

### Song
- id (Recording MBID - primary key) 
- title, duration, artist_id, album_id, release_date, slug
- external_ids: { wikidata_id, freebase_id, isrc, genius_song_id, spotify_track_id }

## Artist Selection Strategy

**Priority by External Relationship Count:**
- High Priority (50+ relationships): Process first
- Medium Priority (10-49 relationships): Process second
- Skip (<10 relationships): Likely not worth including

## Data Collection Workflow

### 1. Get Artists by Priority
```
GET /ws/2/artist?query=*&inc=url-rels&limit=100
Filter by relationship count, sort descending
```

### 2. For Each Artist: Get Albums
```
GET /ws/2/release-group?artist={mbid}&type=album&fmt=json
Skip non-album types (singles, compilations)
```

### 3. For Each Album: Get Canonical Release  
```
GET /ws/2/release-group/{mbid}?inc=releases&fmt=json
Pick earliest official release (avoid bootlegs/promos)
```

### 4. For Each Release: Get Songs
```
GET /ws/2/release/{mbid}?inc=recordings+url-rels&fmt=json
Extract track listing and external relationship URLs
```

### 5. Extract External IDs
From relationship URLs in each entity, extract:
- Discogs IDs, Genius IDs, Spotify IDs, Wikidata Q-numbers
- Store for future cross-platform data enrichment

## Phase 1 Implementation
- MusicBrainz foundation only (basic metadata + external IDs)
- Build site with core functionality

## Phase 2 Enhancement  
- Use collected external IDs to fetch lyrics, images, additional metadata
- No fuzzy matching required - direct ID-based lookups

## Tech Stack
- Framework: Nuxt + Nuxt UI (or Next.js + shadcn)
- Database: Cloudflare D1 + Drizzle ORM
- Storage: Cloudflare R2