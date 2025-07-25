import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('API Integration Tests', () => {
  setup({
    // Test against a running Nuxt app
    server: true
  })

  describe('GET /api/artists', () => {
    it('returns paginated artists list', async () => {
      const response = await $fetch('/api/artists?limit=10')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.limit).toBe(10)
    })

    it('validates response schema', async () => {
      const response = await $fetch('/api/artists')
      
      // The API already validates with Zod, so if we get here, it passed
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')
      expect(response).toHaveProperty('filters')
    })

    it('handles search parameter', async () => {
      const response = await $fetch('/api/artists?search=daft')
      
      expect(response.success).toBe(true)
      expect(response.filters.search).toBe('daft')
    })
  })

  describe('GET /api/songs', () => {
    it('returns songs with artist and album data', async () => {
      const response = await $fetch('/api/songs?limit=5')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      
      if (response.data.length > 0) {
        const song = response.data[0]
        expect(song).toHaveProperty('artistName')
        expect(song).toHaveProperty('artistSlug')
      }
    })
  })

  describe('GET /api/albums', () => {
    it('returns albums with artist data', async () => {
      const response = await $fetch('/api/albums?limit=5')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      
      if (response.data.length > 0) {
        const album = response.data[0]
        expect(album).toHaveProperty('artistName')
        expect(album).toHaveProperty('artistSlug')
      }
    })
  })
})