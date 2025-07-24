# Data Source Mapping for daft.fm

## Song Entity

| Field | Source API | Difficulty | Notes |
|-------|------------|------------|-------|
| ID | MusicBrainz | Easy | MBID (UUID) |
| title | MusicBrainz | Easy | Basic field |
| duration | MusicBrainz | Easy | In milliseconds, convert to seconds |
| artist | MusicBrainz | Easy | From artist-credit field |
| album | MusicBrainz | Easy | From releases array |
| release_date | MusicBrainz | Easy | Basic field |
| slug | Generated | Easy | Create from title + ID |
| lyrics | Genius | Hard | No direct API endpoint, need scraping |
| annotations | Genius | Medium | Available via API but complex structure |
| annotation_count | Genius | Easy | Simple field in API |
| credits | Discogs | Hard | Need to match songs across APIs |

## Artist Entity

| Field | Source API | Difficulty | Notes |
|-------|------------|------------|-------|
| ID | MusicBrainz | Easy | MBID (UUID) |
| name | MusicBrainz | Easy | Basic field |
| country | MusicBrainz | Easy | Country code |
| formed_year | MusicBrainz | Easy | From life-span.begin |
| genres | MusicBrainz | Easy | From tags array |
| slug | Generated | Easy | Create from name + ID |
| bio/description | Discogs | Hard | Need to match artists across APIs |
| social_media | Genius | Medium | Available but need artist search first |
| images/photos | Multiple | Medium | Available from all APIs |

## Album Entity

| Field | Source API | Difficulty | Notes |
|-------|------------|------------|-------|
| ID | MusicBrainz | Easy | MBID (UUID) |
| title | MusicBrainz | Easy | Basic field |
| artist | MusicBrainz | Easy | From artist-credit |
| release_date | MusicBrainz | Easy | Basic field |
| track_count | MusicBrainz | Easy | Basic field |
| track_list | MusicBrainz | Medium | Need to fetch with includes |
| cover_art | MusicBrainz | Medium | Need Cover Art Archive API |
| slug | Generated | Easy | Create from title + ID |
| genres | MusicBrainz | Easy | From tags or inherit from artist |

## Recommendations Based on Difficulty

### Start With (Easy):
- All basic MusicBrainz fields (ID, title, name, dates, etc.)
- Generated slugs
- Basic genre tags

### Phase 2 (Medium):
- Cover art from Cover Art Archive
- Track listings with includes
- Artist images
- Genius annotations

### Phase 3 (Hard):
- Lyrics (requires scraping)
- Cross-API data matching (Discogs credits, bios)
- Advanced social media integration