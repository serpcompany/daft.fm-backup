import { describe, it, expect } from 'vitest'
import {
  artistSchema,
  albumSchema,
  songSchema,
  artistListResponseSchema,
  albumListResponseSchema,
  songListResponseSchema,
  paginationSchema
} from '../schemas'

describe('API Schemas', () => {
  describe('artistSchema', () => {
    it('should validate a valid artist object', () => {
      const validArtist = {
        id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
        name: 'Daft Punk',
        slug: 'daft-punk',
        urlSlug: 'daft-punk',
        country: 'FR',
        formedYear: 1993,
        genres: '["electronic", "house"]',
        bio: 'A French electronic music duo',
        images: '["image1.jpg", "image2.jpg"]',
        wikidataId: null,
        externalIds: null,
        createdAt: '2024-07-24T13:00:00.000Z',
        updatedAt: '2024-07-24T13:00:00.000Z'
      }

      const result = artistSchema.safeParse(validArtist)
      expect(result.success).toBe(true)
    })

    it('should reject an artist with missing required fields', () => {
      const invalidArtist = {
        id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
        name: 'Daft Punk'
        // missing slug, urlSlug
      }

      const result = artistSchema.safeParse(invalidArtist)
      expect(result.success).toBe(false)
    })
  })

  describe('paginationSchema', () => {
    it('should validate pagination with number total', () => {
      const pagination = {
        page: 1,
        limit: 20,
        hasMore: true,
        total: 100
      }

      const result = paginationSchema.safeParse(pagination)
      expect(result.success).toBe(true)
    })

    it('should validate pagination with "unknown" total', () => {
      const pagination = {
        page: 1,
        limit: 20,
        hasMore: true,
        total: 'unknown'
      }

      const result = paginationSchema.safeParse(pagination)
      expect(result.success).toBe(true)
    })
  })

  describe('API Response Schemas', () => {
    it('should validate a valid artist list response', () => {
      const response = {
        success: true,
        data: [
          {
            id: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
            name: 'Daft Punk',
            slug: 'daft-punk',
            urlSlug: 'daft-punk',
            country: 'FR',
            formedYear: 1993,
            genres: '["electronic", "house"]',
            bio: null,
            images: null,
            wikidataId: null,
            externalIds: null,
            createdAt: '2024-07-24T13:00:00.000Z',
            updatedAt: '2024-07-24T13:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          hasMore: false,
          total: 1
        },
        filters: {
          search: null
        }
      }

      const result = artistListResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it('should validate a song list response with album data', () => {
      const response = {
        success: true,
        data: [
          {
            id: 's1234',
            title: 'One More Time',
            slug: 'one-more-time',
            duration: 320,
            artistId: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
            albumId: 'a1234',
            releaseDate: null,
            lyrics: null,
            annotations: null,
            isrc: null,
            wikidataId: null,
            externalIds: null,
            createdAt: '2024-07-24T13:00:00.000Z',
            updatedAt: '2024-07-24T13:00:00.000Z',
            artistName: 'Daft Punk',
            artistSlug: 'daft-punk',
            albumTitle: 'Discovery',
            albumSlug: 'discovery'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          hasMore: false,
          total: 1
        },
        filters: {
          search: null,
          artistId: null,
          albumId: null
        }
      }

      const result = songListResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })
  })
})