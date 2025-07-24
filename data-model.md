# Data Model for daft.fm

## Song
- ID (or some unique identifier that can be used for matching)
- title
- duration
- artist
- album
- release_date
- slug
- lyrics
- annotations (from Genius - song meanings/interpretations - high word count)
- annotation_count (from Genius)
- credits (producer, writer, etc - from Discogs)

## Artist
- ID (or some unique identifier that can be used for matching)
- name
- country
- formed_year
- genres (start with artist-level genres, can add song/album later)
- slug
- images?
- bio/description (from Discogs - artist background info - high word count)
- social_media (from Genius - Twitter, Instagram, etc)
- images/photos (from multiple sources)

## Album
- ID (or some unique identifier that can be used for matching)
- title
- artist
- release_date
- track_count
- track_list
- cover_art
- slug
- genres?
- tags?

## API Reference Links

### Genius API
- Main docs: https://docs.genius.com/
- Song annotations example: https://genius.com/songs/378195/apple_music_player (see the yellow highlighted sections)
- Artist social media fields: https://lyricsgenius.readthedocs.io/en/master/reference/api.html

### Discogs API  
- Main docs: https://www.discogs.com/developers
- Release credits example: https://www.discogs.com/release/249504-Nirvana-Nevermind (scroll to credits section)
- Artist bio example: https://www.discogs.com/artist/224506-Nirvana (see profile section)
- Release notes example: https://www.discogs.com/release/249504-Nirvana-Nevermind (see notes section)

### MusicBrainz API
- Main docs: https://musicbrainz.org/doc/MusicBrainz_API
- Artist example: https://musicbrainz.org/artist/a74b1b7f-71a5-4011-9441-d0b5e4122711 (Radiohead)

## Questions to Consider
1. Do we need to handle multiple artists per song (collaborations)? -- an artist is an artist, so theyd be related
2. Should we track different versions of the same song (live, acoustic, remix)? -- i would rather not
3. Do we want to store lyrics? - yes
4. Should we track chart positions or popularity metrics? - no, that would be "charts" and we arent collecting them yet
5. Do we need to handle compilations/various artist albums? -- Skip for now