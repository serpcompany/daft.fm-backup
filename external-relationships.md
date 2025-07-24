# External Database Relationships

## Primary External Sources to Track

When processing MusicBrainz entities, we'll store relationships to these external databases:

### Music Databases
- **Discogs** - Detailed release info, credits, marketplace data
- **AllMusic** - Professional reviews, biographies, comprehensive metadata
- **Rate Your Music** - User ratings, detailed genre classifications
- **Last.fm** - User listening data, tags, similar artists

### Lyrics & Annotations
- **Genius** - Lyrics, annotations, song meanings
- **LyricFind** - Licensed lyrics content
- **Musixmatch** - Lyrics with timestamps

### Streaming & Commercial
- **Spotify** - Streaming data, playlists, audio features
- **Apple Music** - Streaming catalog
- **YouTube** - Music videos, official channels
- **Bandcamp** - Independent artist releases

### Reference & Wiki
- **Wikidata** - Structured knowledge base
- **Wikipedia** - Encyclopedic information
- **MusicBrainz** - Cross-references between entities

### Charts & Industry
- **Billboard** - Chart positions, industry data

## Storage Strategy

For each entity (artist/album/song), store external IDs like:
```
external_ids: {
  discogs_master_id: "8304",
  discogs_artist_id: "1289", 
  genius_artist_id: "405",
  spotify_artist_id: "4tZwfgrHOc3mvqYlEYSvVi",
  wikidata_id: "Q207816",
  allmusic_artist_id: "mn0000362836"
}
```

## Benefits
- Direct API access instead of fuzzy name matching
- Reliable cross-database linking
- Can enrich data from multiple sources confidently
- Reduces "matching difficulty" from Hard to Medium/Easy

## Limitations
- Not all entities will have relationships (user-submitted)
- Popular artists/albums more likely to have complete relationships
- Need fallback strategies for entities without relationships