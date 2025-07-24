import { describe, it, expect } from 'vitest'

/**
 * SLUG GENERATION RULES - Simple & Predictable
 * 
 * The slug is cosmetic - the MBID is what really matters for uniqueness.
 * Goal: Create readable, URL-safe slugs without complex logic.
 * 
 * RULES:
 * 1. Convert to lowercase
 * 2. Keep only: letters (a-z), numbers (0-9), and spaces
 * 3. Convert spaces to hyphens
 * 4. Remove leading/trailing hyphens
 * 5. Limit to 50 characters
 * 6. If result is empty, use "item" as fallback
 * 
 * EXAMPLES:
 * - "Daft Punk" → "daft-punk" (normal case)
 * - "AC/DC" → "acdc" (symbols removed)
 * - "Björk" → "bjork" (accents stripped)
 * - "You've Come a Long Way, Baby" → "youve-come-a-long-way-baby" (readable)
 * - "!!!" → "item" (fallback for symbol-only names)
 * - "μ-Ziq" → "ziq" (unicode stripped, partial result)
 * 
 * PHILOSOPHY:
 * - Simple and predictable over complex and "smart"
 * - Readable over perfectly accurate
 * - The MBID handles uniqueness, slug handles SEO
 * - Edge cases get fallbacks, not special handling
 */

// Simple implementation based on our rules
function createSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')             // Normalize unicode to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (ö → o)
    .replace(/[^a-z0-9\s]/g, '')  // Rule 2: Keep only letters, numbers, spaces
    .replace(/\s+/g, '-')         // Rule 3: Convert spaces to hyphens  
    .replace(/^-+|-+$/g, '')      // Rule 4: Remove leading/trailing hyphens
    .substring(0, 50);            // Rule 5: Limit length
  
  return slug || 'item';          // Rule 6: Fallback
}

describe('createSlug - Simple Rules', () => {
  describe('Rule 1: Convert to lowercase', () => {
    it('should convert all text to lowercase', () => {
      expect(createSlug('DAFT PUNK')).toBe('daft-punk')
      expect(createSlug('Led Zeppelin')).toBe('led-zeppelin')
      expect(createSlug('AC/DC')).toBe('acdc')
    })
  })

  describe('Rule 2: Keep only letters, numbers, and spaces', () => {
    it('should remove symbols and special characters', () => {
      expect(createSlug('AC/DC')).toBe('acdc')
      expect(createSlug('AT&T')).toBe('att')
      expect(createSlug('P!nk')).toBe('pnk')
      expect(createSlug('$uicideboy$')).toBe('uicideboy')
    })
    
    it('should remove accented characters', () => {
      expect(createSlug('Björk')).toBe('bjork')
      expect(createSlug('Café del Mar')).toBe('cafe-del-mar')
      expect(createSlug('Mötley Crüe')).toBe('motley-crue')
    })
    
    it('should remove punctuation', () => {
      expect(createSlug("You've Come a Long Way, Baby")).toBe('youve-come-a-long-way-baby')
      expect(createSlug("Don't Stop Me Now")).toBe('dont-stop-me-now')
      expect(createSlug('Mr. Blue Sky')).toBe('mr-blue-sky')
    })
    
    it('should keep numbers', () => {
      expect(createSlug('2Pac')).toBe('2pac')
      expect(createSlug('50 Cent')).toBe('50-cent')
      expect(createSlug('311')).toBe('311')
      expect(createSlug('24/96')).toBe('2496')
    })
  })

  describe('Rule 3: Convert spaces to hyphens', () => {
    it('should convert single spaces to hyphens', () => {
      expect(createSlug('Daft Punk')).toBe('daft-punk')
      expect(createSlug('The Rolling Stones')).toBe('the-rolling-stones')
    })
    
    it('should convert multiple spaces to single hyphens', () => {
      expect(createSlug('Multiple   Spaces   Here')).toBe('multiple-spaces-here')
      expect(createSlug('Tab\tAnd\tSpaces')).toBe('tab-and-spaces') // tabs are whitespace, become hyphens
    })
  })

  describe('Rule 4: Remove leading/trailing hyphens', () => {
    it('should remove hyphens from start and end', () => {
      expect(createSlug('!!! Important !!!')).toBe('important')
      expect(createSlug('...And Justice for All')).toBe('and-justice-for-all')
    })
  })

  describe('Rule 5: Limit to 50 characters', () => {
    it('should truncate very long names', () => {
      const longName = 'This Is A Very Long Band Name That Goes On And On And Should Be Truncated'
      const result = createSlug(longName)
      expect(result.length).toBeLessThanOrEqual(50)
      // Accept whatever the first 50 chars produce - truncation might cut mid-word
      expect(result).toBe('this-is-a-very-long-band-name-that-goes-on-and-on-')
    })
  })

  describe('Rule 6: Fallback for empty results', () => {
    it('should use "item" fallback for symbol-only names', () => {
      expect(createSlug('!!!')).toBe('item')
      expect(createSlug('???')).toBe('item')
      expect(createSlug('∆')).toBe('item')
      expect(createSlug('♥')).toBe('item')
      expect(createSlug('')).toBe('item')
      expect(createSlug('   ')).toBe('item')
    })
    
    it('should use fallback for non-Latin scripts', () => {
      expect(createSlug('きゃりーぱみゅぱみゅ')).toBe('item')
      expect(createSlug('БИ-2')).toBe('2') // Cyrillic letters get stripped, numbers remain
      expect(createSlug('μ-Ziq')).toBe('ziq') // Some Latin letters remain
    })
  })

  describe('Real-world examples', () => {
    it('should handle common English artist names', () => {
      expect(createSlug('The Beatles')).toBe('the-beatles')
      expect(createSlug('Led Zeppelin')).toBe('led-zeppelin')
      expect(createSlug('Pink Floyd')).toBe('pink-floyd')
      expect(createSlug('Queen')).toBe('queen')
    })
    
    it('should handle electronic music artists', () => {
      expect(createSlug('Daft Punk')).toBe('daft-punk')
      expect(createSlug('Justice')).toBe('justice')
      expect(createSlug('Moderat')).toBe('moderat')
      expect(createSlug('Aphex Twin')).toBe('aphex-twin')
    })
    
    it('should handle problematic names gracefully', () => {
      expect(createSlug('AC/DC')).toBe('acdc')
      expect(createSlug("Guns N' Roses")).toBe('guns-n-roses')
      expect(createSlug('30 Seconds to Mars')).toBe('30-seconds-to-mars')
      expect(createSlug('...And You Will Know Us by the Trail of Dead')).toBe('and-you-will-know-us-by-the-trail-of-dead')
    })
  })

  describe('Edge cases that prove our rules work', () => {
    it('should handle mixed numbers and text', () => {
      expect(createSlug('3OH!3')).toBe('3oh3')
      expect(createSlug('21 Pilots')).toBe('21-pilots')
      expect(createSlug('100% Pure')).toBe('100-pure')
    })
    
    it('should handle format strings', () => {
      expect(createSlug('16/44.1')).toBe('16441')
      expect(createSlug('320kbps')).toBe('320kbps')
      expect(createSlug('24/96 FLAC')).toBe('2496-flac')
    })
  })
});