import { describe, it, expect } from 'vitest'
import { 
  createSlug, 
  generateArtistUrl, 
  generateAlbumUrl, 
  generateSongUrl 
} from '../../../server/lib/urls'
import type { Artist, Album, Song } from '../../../server/types'

describe('URL validation - clean URLs only', () => {
  // Helper function to check if a string only contains allowed characters
  function isValidUrlPath(url: string): boolean {
    // Only allow: lowercase letters (a-z), numbers (0-9), hyphens (-), and forward slashes (/)
    const validUrlRegex = /^[a-z0-9\/-]+$/;
    return validUrlRegex.test(url);
  }

  describe('slug validation', () => {
    it('should only produce slugs with a-z, 0-9, and hyphens', () => {
      const testCases = [
        'Simple Name',
        'Name with Numbers 123',
        'Special!@#$%^&*()Characters',
        'Unicode: Björk',
        'Symbols: !!!',
        'Mixed: AC/DC & Friends',
        'Apostrophe: Don\'t Stop',
        'Quotes: "Hello World"',
        'Math: 2+2=4',
        'Emoji: 🎵 Music',
        'Japanese: きゃりーぱみゅぱみゅ',
        'Cyrillic: БИ-2',
        'Empty: ',
        'Spaces:    Multiple    Spaces   ',
      ];

      testCases.forEach(testCase => {
        const slug = createSlug(testCase);
        // Check the slug only contains allowed characters (no forward slash in slugs)
        const validSlugRegex = /^[a-z0-9-]+$/;
        expect(
          validSlugRegex.test(slug),
          `Slug for "${testCase}" contains invalid characters: "${slug}"`
        ).toBe(true);
        
        // Also ensure it's not empty
        expect(slug.length).toBeGreaterThan(0);
      });
    });
  });

  describe('full URL validation', () => {
    const mockArtist: Artist = {
      id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
      name: 'Test Artist!!!',
      slug: 'test-artist',
      country: 'US',
      formedYear: 2000,
      genres: null,
      bio: null,
      images: null,
      wikidataId: null,
      externalIds: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAlbum: Album = {
      id: '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c',
      title: 'Test Album!!!',
      slug: 'test-album',
      artistId: mockArtist.id,
      releaseDate: new Date(),
      trackCount: 10,
      coverArt: null,
      wikidataId: null,
      externalIds: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockSong: Song = {
      id: 's1a2b3c4-d5e6-7890-1234-567890abcdef',
      title: 'Test Song!!!',
      slug: 'test-song',
      duration: 300,
      artistId: mockArtist.id,
      albumId: mockAlbum.id,
      releaseDate: new Date(),
      lyrics: null,
      annotations: null,
      isrc: null,
      wikidataId: null,
      externalIds: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should generate clean artist URLs', () => {
      const problematicArtists = [
        { ...mockArtist, name: 'AC/DC' },
        { ...mockArtist, name: '!!!!' },
        { ...mockArtist, name: 'Björk' },
        { ...mockArtist, name: 'The Artist (Formerly Known As Prince)' },
        { ...mockArtist, name: '2Pac & Biggie' },
        { ...mockArtist, name: 'µ-Ziq' },
      ];

      problematicArtists.forEach(artist => {
        const url = generateArtistUrl(artist);
        expect(
          isValidUrlPath(url),
          `Artist URL for "${artist.name}" contains invalid characters: "${url}"`
        ).toBe(true);
      });
    });

    it('should generate clean album URLs', () => {
      const problematicAlbums = [
        { ...mockAlbum, title: 'You\'ve Come a Long Way, Baby' },
        { ...mockAlbum, title: '†' },
        { ...mockAlbum, title: '() [Untitled]' },
        { ...mockAlbum, title: '1999 (Deluxe Edition)' },
      ];

      problematicAlbums.forEach(album => {
        const url = generateAlbumUrl(album, mockArtist);
        expect(
          isValidUrlPath(url),
          `Album URL for "${album.title}" contains invalid characters: "${url}"`
        ).toBe(true);
      });
    });

    it('should generate clean song URLs', () => {
      const problematicSongs = [
        { ...mockSong, title: 'Don\'t Stop Me Now' },
        { ...mockSong, title: 'Song #2' },
        { ...mockSong, title: 'R&B/Soul Mix' },
        { ...mockSong, title: '99% Sure' },
      ];

      problematicSongs.forEach(song => {
        const url = generateSongUrl(song, mockArtist);
        expect(
          isValidUrlPath(url),
          `Song URL for "${song.title}" contains invalid characters: "${url}"`
        ).toBe(true);
      });
    });
  });

  describe('regex pattern validation', () => {
    it('should correctly identify valid URLs', () => {
      const validUrls = [
        '/artists/daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56/',
        '/albums/justice-cross-123/',
        '/songs/one-more-time-456/',
        '/artists/123-numbers-789/',
        '/albums/all-lowercase-abc/',
      ];

      const urlRegex = /^[a-z0-9\/-]+$/;
      
      validUrls.forEach(url => {
        expect(urlRegex.test(url)).toBe(true);
      });
    });

    it('should correctly reject invalid URLs', () => {
      const invalidUrls = [
        '/artists/Capital-Letters-123/', // uppercase
        '/albums/special!-characters-456/', // special char
        '/songs/spaces in url-789/', // spaces
        '/artists/unicode-björk-abc/', // unicode
        '/albums/symbols-@#$-def/', // symbols
      ];

      const urlRegex = /^[a-z0-9\/-]+$/;
      
      invalidUrls.forEach(url => {
        expect(urlRegex.test(url)).toBe(false);
      });
    });
  });
});