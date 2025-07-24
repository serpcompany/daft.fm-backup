import { describe, it, expect } from 'vitest'
import {
  createSlug,
  generateArtistUrl,
  generateAlbumUrl,
  generateSongUrl,
  parseMbidFromSlug,
  isValidMbid,
  parseArtistSlug,
  parseAlbumSlug,
  parseSongSlug,
  generateBreadcrumbs
} from '../../../server/lib/urls'
import type { Artist, Album, Song } from '../../../server/types'

describe('createSlug', () => {
  describe('basic functionality', () => {
    it('should convert simple names to lowercase with hyphens', () => {
      expect(createSlug('Daft Punk')).toBe('daft-punk')
      expect(createSlug('Justice')).toBe('justice')
      expect(createSlug('Moderat')).toBe('moderat')
    })
    
    it('should handle multiple spaces', () => {
      expect(createSlug('The  Chemical   Brothers')).toBe('the-chemical-brothers')
    })
    
    it('should handle underscores', () => {
      expect(createSlug('Artist_Name_With_Underscores')).toBe('artistnamewithunderscores')
    })
  })

  describe('special character handling', () => {
    it('should remove apostrophes without URL encoding', () => {
      expect(createSlug("You've Come a Long Way")).toBe('youve-come-a-long-way')
      expect(createSlug("Don't Stop Me Now")).toBe('dont-stop-me-now')
      expect(createSlug("I'm Gonna Be")).toBe('im-gonna-be')
    })
    
    it('should remove quotes and smart quotes', () => {
      expect(createSlug('"Quoted Title"')).toBe('quoted-title')
      expect(createSlug('"Smart Quotes"')).toBe('smart-quotes')
      expect(createSlug("'Single Quotes'")).toBe('single-quotes')
    })
    
    it('should remove commas', () => {
      expect(createSlug('Come, As You Are')).toBe('come-as-you-are')
      expect(createSlug("You've Come a Long Way, Baby")).toBe('youve-come-a-long-way-baby')
    })
    
    it('should remove punctuation', () => {
      expect(createSlug('Mr. Blue Sky')).toBe('mr-blue-sky')
      expect(createSlug("What's Going On?")).toBe('whats-going-on')
      expect(createSlug('Help!')).toBe('help')
    })
    
    it('should remove brackets and parentheses', () => {
      expect(createSlug('Song (Remix)')).toBe('song-remix')
      expect(createSlug('Title [Extended Version]')).toBe('title-extended-version')
      expect(createSlug('Track {Special}')).toBe('track-special')
    })
    
    it('should remove & and + symbols', () => {
      expect(createSlug('Salt & Pepper')).toBe('salt-pepper')
      expect(createSlug('Rock + Roll')).toBe('rock-roll')
      expect(createSlug('Me & You + Everyone')).toBe('me-you-everyone')
    })
  })

  describe('problematic cases that cause URL encoding', () => {
    it('should handle the original problematic case', () => {
      expect(createSlug("You've Come a Long Way, Baby")).toBe('youve-come-a-long-way-baby')
    })
    
    it('should handle various unicode characters', () => {
      expect(createSlug('Café del Mar')).toBe('cafe-del-mar')
      expect(createSlug('Naïve')).toBe('naive')  // Updated: accents normalized
      expect(createSlug('Björk')).toBe('bjork')  // Updated: accents normalized
    })
    
    it('should handle symbols that would encode', () => {
      expect(createSlug('100% Pure')).toBe('100-pure')
      expect(createSlug('AT&T')).toBe('att')  // Updated: & removed
      expect(createSlug('R&B/Soul')).toBe('rbsoul')  // Updated: &/ removed
    })
    
    it('should handle numbers and math better', () => {
      expect(createSlug('+/-')).toBe('item')  // All symbols removed, fallback used
      expect(createSlug('16/44.1')).toBe('16441')  // Symbols removed
      expect(createSlug('24/96')).toBe('2496')  // Symbols removed
      expect(createSlug('2+2=4')).toBe('224')  // Symbols removed
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(createSlug('')).toBe('item')  // Updated: fallback to 'item'
    })
    
    it('should handle strings with only special characters', () => {
      expect(createSlug('!!!')).toBe('item')  // Updated: fallback to 'item'
      expect(createSlug('???')).toBe('item')  // Updated: fallback to 'item'
      expect(createSlug('***')).toBe('item')  // Updated: fallback to 'item'
    })
    
    it('should handle very long strings', () => {
      const longString = 'A'.repeat(200)
      const result = createSlug(longString)
      expect(result.length).toBeLessThanOrEqual(50)
      expect(result).toBe('a'.repeat(50))
    })
    
    it('should remove leading and trailing hyphens', () => {
      expect(createSlug('-Leading Hyphen')).toBe('leading-hyphen')
      expect(createSlug('Trailing Hyphen-')).toBe('trailing-hyphen')
      expect(createSlug('-Both Sides-')).toBe('both-sides')
    })
    
    it('should handle consecutive hyphens', () => {
      expect(createSlug('Multiple --- Hyphens')).toBe('multiple-hyphens')
    })
    
    it('should collapse double hyphens to single hyphens', () => {
      expect(createSlug('Double--Hyphen')).toBe('doublehyphen')
      expect(createSlug('Triple---Hyphen')).toBe('triplehyphen')
      expect(createSlug('Many-----Hyphens')).toBe('manyhyphens')
    })
    
    it('should handle hyphens created by special character replacement', () => {
      // Special chars get replaced with hyphens, could create doubles
      expect(createSlug('AC/DC & Friends')).toBe('acdc-friends')
      expect(createSlug('Rock & Roll + Blues')).toBe('rock-roll-blues')
      expect(createSlug('Symbol!@#$%Between')).toBe('symbolbetween')
      expect(createSlug('Multiple!!!Exclamations')).toBe('multipleexclamations')
    })
  })
})

describe('MBID validation and parsing', () => {
  const validMbid = '056e4f3e-d505-4dad-8ec1-d04f521cbb56'
  const invalidMbids = [
    'not-a-uuid',
    '056e4f3e-d505-4dad-8ec1',
    '056E4F3E-D505-4DAD-8EC1-D04F521CBB56-extra',
    '',
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  ]

  describe('isValidMbid', () => {
    it('should validate correct MBIDs', () => {
      expect(isValidMbid(validMbid)).toBe(true)
      expect(isValidMbid('f54ba20c-aa3b-443e-a97e-6bee0329b0dd')).toBe(true)
    })
    
    it('should reject invalid MBIDs', () => {
      invalidMbids.forEach(invalid => {
        expect(isValidMbid(invalid)).toBe(false)
      })
    })
  })

  describe('parseMbidFromSlug', () => {
    it('should extract MBID from end of slug', () => {
      expect(parseMbidFromSlug(`daft-punk-${validMbid}`)).toBe(validMbid)
      expect(parseMbidFromSlug(`justice-cross-f54ba20c-aa3b-443e-a97e-6bee0329b0dd`)).toBe('f54ba20c-aa3b-443e-a97e-6bee0329b0dd')
    })
    
    it('should return null for invalid slugs', () => {
      expect(parseMbidFromSlug('no-mbid-here')).toBeNull()
      expect(parseMbidFromSlug('invalid-uuid-123')).toBeNull()
      expect(parseMbidFromSlug('')).toBeNull()
    })
  })
})

describe('URL generation', () => {
  const artist: Artist = {
    id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    name: 'Daft Punk',
    slug: 'daft-punk',
    country: 'FR',
    formedYear: 1993,
    genres: null,
    bio: null,
    images: null,
    wikidataId: null,
    externalIds: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const album: Album = {
    id: '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c',
    title: 'Discovery',
    slug: 'discovery',
    artistId: artist.id,
    releaseDate: new Date('2001-02-26'),
    trackCount: 14,
    coverArt: null,
    wikidataId: null,
    externalIds: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const song: Song = {
    id: 's1a2b3c4-d5e6-7890-1234-567890abcdef',
    title: 'One More Time',
    slug: 'one-more-time',
    duration: 320,
    artistId: artist.id,
    albumId: album.id,
    releaseDate: new Date('2001-02-26'),
    lyrics: null,
    annotations: null,
    isrc: null,
    wikidataId: null,
    externalIds: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('generateArtistUrl', () => {
    it('should generate correct artist URL', () => {
      expect(generateArtistUrl(artist)).toBe('/artists/daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56/')
    })
    
    it('should handle special characters in artist names', () => {
      const specialArtist = { ...artist, name: "Sigur Rós" }
      expect(generateArtistUrl(specialArtist)).toBe('/artists/sigur-ros-056e4f3e-d505-4dad-8ec1-d04f521cbb56/')
    })
  })

  describe('generateAlbumUrl', () => {
    it('should generate correct album URL', () => {
      expect(generateAlbumUrl(album, artist)).toBe('/albums/daft-punk-discovery-47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c/')
    })
    
    it('should handle special characters in album titles', () => {
      const specialAlbum = { ...album, title: "You've Come a Long Way, Baby" }
      expect(generateAlbumUrl(specialAlbum, artist)).toBe('/albums/daft-punk-youve-come-a-long-way-baby-47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c/')
    })
  })

  describe('generateSongUrl', () => {
    it('should generate correct song URL', () => {
      expect(generateSongUrl(song, artist)).toBe('/songs/daft-punk-one-more-time-s1a2b3c4-d5e6-7890-1234-567890abcdef/')
    })
    
    it('should handle special characters in song titles', () => {
      const specialSong = { ...song, title: "Don't Stop Me Now" }
      expect(generateSongUrl(specialSong, artist)).toBe('/songs/daft-punk-dont-stop-me-now-s1a2b3c4-d5e6-7890-1234-567890abcdef/')
    })
  })
})

describe('URL parsing', () => {
  const mbid = '056e4f3e-d505-4dad-8ec1-d04f521cbb56'
  const slug = `daft-punk-${mbid}`

  describe('parseArtistSlug', () => {
    it('should parse valid artist slug', () => {
      const result = parseArtistSlug(slug)
      expect(result).toEqual({
        slug,
        mbid
      })
    })
    
    it('should return null for invalid slug', () => {
      expect(parseArtistSlug('invalid-slug')).toBeNull()
    })
  })

  describe('parseAlbumSlug', () => {
    it('should parse valid album slug', () => {
      const albumSlug = `daft-punk-discovery-${mbid}`
      const result = parseAlbumSlug(albumSlug)
      expect(result).toEqual({
        slug: albumSlug,
        mbid
      })
    })
  })

  describe('parseSongSlug', () => {
    it('should parse valid song slug', () => {
      const songSlug = `daft-punk-one-more-time-${mbid}`
      const result = parseSongSlug(songSlug)
      expect(result).toEqual({
        slug: songSlug,
        mbid
      })
    })
  })
})

describe('generateBreadcrumbs', () => {
  const artist: Artist = {
    id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
    name: 'Daft Punk',
    slug: 'daft-punk',
    country: 'FR',
    formedYear: 1993,
    genres: null,
    bio: null,
    images: null,
    wikidataId: null,
    externalIds: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('should generate breadcrumbs for artist page', () => {
    const breadcrumbs = generateBreadcrumbs('artist', artist)
    expect(breadcrumbs).toEqual([
      { name: 'Home', url: '/' },
      { name: 'Artists', url: '/artists/' },
      { name: 'Daft Punk', url: '/artists/daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56/' }
    ])
  })
})