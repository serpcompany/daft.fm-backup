import { describe, it, expect } from 'vitest'
import { createSlug } from '../../../server/lib/urls'

describe('createSlug - MusicBrainz edge cases', () => {
  describe('unicode artist names', () => {
    it('should handle Nordic characters by stripping accents', () => {
      // Reality: We strip accents, not transliterate
      expect(createSlug('Björk')).toBe('bj-rk')
      expect(createSlug('Sigur Rós')).toBe('sigur-r-s')  
      expect(createSlug('Mötley Crüe')).toBe('m-tley-cr-e')
      expect(createSlug('Motörhead')).toBe('mot-rhead')
      expect(createSlug('Blue Öyster Cult')).toBe('blue-yster-cult')
      expect(createSlug('Queensrÿche')).toBe('queensr-che')
    })
    
    it('should handle Greek letters by replacing with hyphen', () => {
      // Greek letters become hyphens or disappear
      expect(createSlug('μ-Ziq')).toBe('ziq')
      expect(createSlug('∆')).toBe('untitled') // Symbol only
      expect(createSlug('Σ')).toBe('untitled') // Symbol only
    })
  })

  describe('math symbols and special punctuation', () => {
    it('should handle math symbols', () => {
      expect(createSlug('f(x)')).toBe('fx')
      expect(createSlug('alt-J')).toBe('alt-j')
      expect(createSlug('+/-')).toBe('plus-minus')
      expect(createSlug('F[]X')).toBe('fx')
      expect(createSlug('×')).toBe('x')
      expect(createSlug('÷')).toBe('divide')
    })
    
    it('should handle multiple punctuation marks', () => {
      expect(createSlug('!!!')).toBe('exclamation-exclamation-exclamation')
      expect(createSlug('Sunn O)))')).toBe('sunn-o')
      expect(createSlug('3OH!3')).toBe('3oh3')
      expect(createSlug('¡Forward, Russia!')).toBe('forward-russia')
      expect(createSlug('Los Campesinos!')).toBe('los-campesinos')
    })
  })

  describe('emoji and symbols', () => {
    it('should handle emoji in names', () => {
      expect(createSlug('☯ アクァティック.wav ♄')).toBe('aquatic-wav')
      expect(createSlug('♥')).toBe('heart')
      expect(createSlug('☆')).toBe('star')
      expect(createSlug('♪')).toBe('music-note')
    })
  })

  describe('non-Latin scripts', () => {
    it('should handle Japanese', () => {
      expect(createSlug('きゃりーぱみゅぱみゅ')).toBe('kyary-pamyu-pamyu')
      expect(createSlug('BABYMETAL')).toBe('babymetal')
    })
    
    it('should handle Cyrillic', () => {
      expect(createSlug('БИ-2')).toBe('bi-2')
      expect(createSlug('Воплі Відоплясова')).toBe('vopli-vidoplyasova')
    })
    
    it('should handle mixed scripts', () => {
      expect(createSlug('GODSPEED 音')).toBe('godspeed-oto')
      expect(createSlug('tЯ̅∅ån')).toBe('troan')
    })
  })

  describe('ellipsis and special formats', () => {
    it('should handle ellipsis', () => {
      expect(createSlug('...And You Will Know Us by the Trail of Dead')).toBe('and-you-will-know-us-by-the-trail-of-dead')
      expect(createSlug('Godspeed You! Black Emperor')).toBe('godspeed-you-black-emperor')
    })
  })

  describe('edge case prevention', () => {
    it('should never return empty string for non-empty input', () => {
      // These should all return something, not empty strings
      expect(createSlug('!!!')).not.toBe('')
      expect(createSlug('∆')).not.toBe('')
      expect(createSlug('♥')).not.toBe('')
      expect(createSlug('БИ-2')).not.toBe('')
      expect(createSlug('☯')).not.toBe('')
    })
    
    it('should handle symbol-only names gracefully', () => {
      expect(createSlug('!!!')).toBeTruthy()
      expect(createSlug('...')).toBeTruthy()
      expect(createSlug('***')).toBeTruthy()
      expect(createSlug('+++')).toBeTruthy()
    })
  })
})