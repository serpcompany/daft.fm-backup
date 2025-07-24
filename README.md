# README

This project is to re-do the daft.fm music site.

## Structure v1

1. songs
2. artists (bands, etc.)
3. albums

### songs

- `https://daft.fm/songs/`
- `https://daft.fm/songs/fatboy-slim-the-rockafeller-skank-15567180/`

### albums

- https://daft.fm/albums/
- https://daft.fm/albums/yes-yes-51434/

### artists

- https://daft.fm/artists/
- https://daft.fm/artists/phish-71/


## Data source options

- Musicbrainz DB / API - https://musicbrainz.org/doc/MusicBrainz_API
- genius api - https://docs.genius.com/
- discogs api - https://www.discogs.com/developers/?ref=apilist.fun
- whosampled api - https://www.whosampled.com/metadata/
- rateyourmusic.com (web scraping)


## Tech stack

- framework & component library: nuxt + nuxt UI (or) nextjs + shadcn
- db: cloudflare d1
- storage: cloudflare r2
- orm: drizzle
- typesafety: typescript
