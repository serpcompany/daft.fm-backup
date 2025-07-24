# daft.fm Data Collection Approach

## Core Strategy

We're using **MusicBrainz as our primary data source** to avoid duplicate content and maintain a clean, canonical music database.

## The Duplicate Problem

Music databases like MusicBrainz track every single release of an album - different countries, formats (vinyl, CD, cassette), reissues, special editions, etc. This creates massive duplication:

- Fleetwood Mac's "Rumours" has 50+ individual releases
- Daft Punk's albums have dozens of variations each
- Every song appears multiple times with slight differences

## Our Solution: Release Groups + Canonical Selection

### Step 1: Use Release Groups
- **Release Group** = the abstract album concept (e.g., "Discovery" by Daft Punk)
- **Release** = specific pressing/format (e.g., "Discovery" 2001 UK CD vs 2001 French vinyl)

### Step 2: Filter to Albums Only
- Query release groups with `type=Album` 
- Skip: Singles, EPs, Compilations, Soundtracks, Remixes, Live albums

### Step 3: Pick One Canonical Release
For each release group, automatically select ONE release using this priority:
1. Prefer "Official" status over bootlegs/promotional
2. Prefer earliest release date
3. Prefer CD format over vinyl/cassette
4. Pick first result if still tied

**Key insight**: It doesn't matter which specific release we pick since the song content is essentially identical.

## Data Flow

1. **Artist**: Get from MusicBrainz artist endpoint
2. **Albums**: Get release groups (type=Album) for that artist  
3. **Songs**: For each release group, pick canonical release and get its tracklist

## Result

- Clean discography (Daft Punk shows 4-5 albums, not dozens)
- No duplicate songs ("One More Time" appears once, not 50+ times)
- Consistent, automated approach
- Can add other data sources (Genius, Discogs) later by matching to our canonical entries

## Next Steps

- Implement this approach in code
- Test with a few artists to verify it works
- Add other data sources once core structure is solid