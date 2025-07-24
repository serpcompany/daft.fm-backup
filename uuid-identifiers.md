# Trusted UUID/ID Collection Strategy

## Core Principle
Collect as many standardized identifiers as possible for each entity to enable reliable cross-platform matching and future integrations.

## Artist Identifiers

### Universal IDs
- **MBID** (MusicBrainz ID) - Primary UUID identifier
- **Wikidata ID** - Structured knowledge base ID (Q-numbers)
- **Freebase ID** - Google's canonical knowledge graph ID (often found on Wikidata)
- **ISNI** - International Standard Name Identifier
- **IPI** - Interested Parties Information code

### Platform-Specific IDs
- **Discogs Artist ID** - Numeric ID from Discogs
- **Genius Artist ID** - Numeric ID from Genius
- **Spotify Artist ID** - Base62 string ID
- **Apple Music Artist ID** - Numeric ID
- **Last.fm Artist MBID** - Often matches MusicBrainz
- **AllMusic Artist ID** - String ID (mn-prefixed)

## Album/Release Identifiers

### Universal IDs
- **Release Group MBID** - MusicBrainz release group UUID
- **Release MBID** - Specific release UUID
- **Wikidata ID** - For notable albums
- **Freebase ID** - Google's canonical knowledge graph ID
- **Barcode/UPC** - Universal Product Code for physical releases
- **Catalog Number** - Label's catalog identifier

### Platform-Specific IDs
- **Discogs Master ID** - For release groups
- **Discogs Release ID** - For specific releases
- **Spotify Album ID** - Base62 string
- **Apple Music Album ID** - Numeric ID
- **Genius Album ID** - Numeric ID

## Song/Recording Identifiers

### Universal IDs
- **Recording MBID** - MusicBrainz recording UUID
- **ISRC** - International Standard Recording Code
- **Wikidata ID** - For notable songs
- **Freebase ID** - Google's canonical knowledge graph ID

### Platform-Specific IDs
- **Genius Song ID** - Numeric ID
- **Spotify Track ID** - Base62 string
- **Apple Music Song ID** - Numeric ID
- **YouTube Video ID** - For music videos
- **SoundCloud Track ID** - Numeric ID

## Storage Strategy

Store all collected IDs in a structured format:

```json
{
  "universal_ids": {
    "mbid": "a74b1b7f-71a5-4011-9441-d0b5e4122711",
    "wikidata_id": "Q268298",
    "freebase_id": "/m/06cqb",
    "isni": "0000000115475162",
    "isrc": "GBUM71505078"
  },
  "platform_ids": {
    "discogs_artist_id": "224506",
    "genius_artist_id": "405",
    "spotify_artist_id": "4tZwfgrHOc3mvqYlEYSvVi",
    "allmusic_artist_id": "mn0000362836"
  }
}
```

## Benefits
- Future-proof integrations with new platforms
- Reliable entity matching across databases
- Enables data enrichment from multiple sources
- Provides backup identifiers if primary source fails

## Collection Priority
1. **High Priority**: MBID, Wikidata ID, Freebase ID, ISRC (for songs), Barcode (for albums)
2. **Medium Priority**: Major platform IDs (Spotify, Genius, Discogs)
3. **Low Priority**: Niche platform IDs, catalog numbers

## Implementation Notes
- Always validate UUID format before storing
- Store NULL for missing identifiers rather than empty strings
- Index frequently-used identifiers for fast lookups
- Consider identifier expiration/invalidation policies