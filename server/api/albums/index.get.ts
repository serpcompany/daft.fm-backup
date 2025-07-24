// GET /api/albums - List albums with pagination, search, and filtering

import { getAlbums, searchAlbums, getAlbumsByArtist } from '../../lib/queries'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '20')))
  const search = query.search as string
  const artistId = query.artistId as string

  // Get D1 database instance from Cloudflare binding
  const d1 = event.context.cloudflare?.env?.DB
  if (!d1) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database not available'
    })
  }

  const db = createDb(d1)

  try {
    let albums
    let hasMore = false

    if (search && search.trim()) {
      // Search for albums
      const results = await searchAlbums(db, search.trim(), limit, (page - 1) * limit)
      albums = results
      hasMore = results.length === limit
    } else if (artistId) {
      // Get albums by specific artist
      const results = await getAlbumsByArtist(db, artistId, limit, (page - 1) * limit)
      albums = results
      hasMore = results.length === limit
    } else {
      // Get paginated list of all albums
      const results = await getAlbums(db, limit, (page - 1) * limit)
      albums = results
      hasMore = results.length === limit
    }

    return {
      success: true,
      data: {
        albums,
        pagination: {
          page,
          limit,
          hasMore
        },
        filters: {
          search: search || null,
          artistId: artistId || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching albums:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch albums'
    })
  }
})