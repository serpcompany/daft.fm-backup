import { describe, it, expect } from 'vitest'
import { isValidMbid } from '../urls'

describe('Query Utilities', () => {
  describe('isValidMbid', () => {
    it('should validate correct MusicBrainz IDs', () => {
      expect(isValidMbid('056e4f3e-d505-4dad-8ec1-d04f521cbb56')).toBe(true)
      expect(isValidMbid('f54ba20c-aa3b-443e-a97e-6bee0329b0dd')).toBe(true)
    })

    it('should reject invalid MusicBrainz IDs', () => {
      expect(isValidMbid('invalid-id')).toBe(false)
      expect(isValidMbid('12345')).toBe(false)
      expect(isValidMbid('')).toBe(false)
      expect(isValidMbid('056e4f3e-d505-4dad-8ec1-d04f521cbb5g')).toBe(false) // Invalid character
    })
  })
})