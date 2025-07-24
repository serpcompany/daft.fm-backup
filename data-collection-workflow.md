# Data Collection Workflow

## Overview
This document connects all our research into a step-by-step process for collecting comprehensive music data while avoiding duplicates.

## Artist Selection Strategy

### Popularity-Based Prioritization Using External Relationships

**Hypothesis Tested:** Artists with more external relationships in MusicBrainz correlate with higher popularity/search interest.

**Test Results:**
- Taylor Swift: 91 external relationships
- The Beatles: 66 external relationships  
- Daft Punk: 67 external relationships
- Radiohead: 56 external relationships
- His Name Is Alive (indie): 12 external relationships
- Unknown "Local Band": 1 external relationship

**Selection Criteria:**
- **High Priority (50+ relationships)**: Mega-popular artists, process first
- **Medium Priority (10-49 relationships)**: Notable/popular artists, process second  
- **Low Priority (5-9 relationships)**: Niche but documented artists, process later
- **Skip (<5 relationships)**: Likely incomplete data or very obscure artists

**Implementation:**
```
GET /ws/2/artist?query=*&inc=url-rels&limit=100
Filter artists by relationship count
Sort by relationship count (descending)
Process in priority order
```

## Artist Data Collection

### Step 1: Get Base Artist Data from MusicBrainz
```
GET /ws/2/artist/{mbid}?inc=url-rels&fmt=json
```

**Core Fields to Extract:**
- id (MBID - primary key)
- name
- country
- life-span.begin (formed_year)
- tags (for genres)

**Universal IDs to Extract:**
- MBID (from id field)
- ISNI (from isnis array)
- IPI (from ipis array)

**External Relationships to Extract:**
From relations array, look for these URL types:
- discogs: Extract artist ID from URL
- wikidata: Extract Q-number from URL
- genius: Extract artist ID from URL
- spotify: Extract artist ID from URL
- allmusic: Extract artist ID from URL
- lastfm: Extract artist name/ID from URL

### Step 2: Enrich from Wikidata (if available)
```
Query Wikidata using extracted Q-number
```
**Additional IDs to Extract:**
- Freebase ID (P646 property)
- Additional external identifiers

### Step 3: Enrich from External Sources (if relationship URLs found)
- **Discogs**: Get bio/description using artist ID
- **Genius**: Get social media links using artist ID
- **Spotify**: Get additional metadata using artist ID

## Album Data Collection

### Step 1: Get Release Groups for Artist
```
GET /ws/2/release-group?artist={artist_mbid}&type=album&fmt=json
```

**Filter Criteria:**
- primary-type = "Album" only
- Skip compilations, soundtracks, etc.

### Step 2: For Each Release Group, Get Canonical Release
```
GET /ws/2/release-group/{rg_mbid}?inc=releases+url-rels&fmt=json
```

**Canonical Release Selection Logic:**
1. Filter to status="Official" releases only
2. Prefer earliest date
3. Prefer CD format over vinyl/cassette
4. Pick first result if still tied

### Step 3: Get Full Release Data
```
GET /ws/2/release/{release_mbid}?inc=recordings+url-rels&fmt=json
```

**Core Fields to Extract:**
- Release Group MBID (primary key)
- title
- date (release_date)
- track-count
- barcode

**External Relationships to Extract:**
- discogs: Master ID and/or Release ID
- wikidata: Q-number
- genius: Album ID
- spotify: Album ID

## Song Data Collection

### Step 3: For Each Recording in Release
**Core Fields to Extract:**
- id (Recording MBID - primary key)
- title
- length (duration in milliseconds)
- artist-credit (artist reference)

**Universal IDs to Look For:**
- MBID (from id)
- ISRC (from isrcs array if present)

### Step 4: Get Extended Recording Data
```
GET /ws/2/recording/{recording_mbid}?inc=url-rels&fmt=json
```

**External Relationships to Extract:**
- genius: Song ID for lyrics/annotations
- spotify: Track ID
- youtube: Video ID

## Implementation Priority

### Phase 1: MusicBrainz Foundation
- Implement artist → release groups → canonical releases → recordings flow
- Extract all MBIDs, basic metadata, and external relationship URLs
- Store external IDs for future use

### Phase 2: ID Collection
- Query Wikidata for Freebase IDs when available
- Extract platform-specific IDs from relationship URLs
- Build comprehensive identifier database

### Phase 3: Data Enrichment
- Use collected IDs to fetch data from external sources
- Genius: lyrics, annotations
- Discogs: credits, detailed info
- Spotify: audio features, popularity

## Data Storage Structure

```json
{
  "artist": {
    "mbid": "primary-key",
    "name": "...",
    "country": "...",
    "external_ids": {
      "wikidata_id": "Q123",
      "freebase_id": "/m/abc",
      "discogs_artist_id": "456",
      "genius_artist_id": "789"
    },
    "external_urls": {
      "discogs": "https://...",
      "genius": "https://..."
    }
  },
  "albums": [...],
  "songs": [...]
}
```

## Benefits of This Approach
- Single source of truth (MusicBrainz) prevents duplicates
- Comprehensive ID collection enables reliable cross-referencing
- Phased implementation allows incremental improvement
- External relationships provide high-confidence data matching