// GET /api/songs - List songs with pagination, search, and filtering  

import { getSongs, getSongsWithArtists, searchSongs, getSongsByArtist, getSongsByAlbum } from '../../lib/queries'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt((query.page as string) || '1'))
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '20')))
  const search = query.search as string
  const artistId = query.artistId as string
  const albumId = query.albumId as string

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
    let songs
    let hasMore = false

    if (search && search.trim()) {
      // Search for songs
      const results = await searchSongs(db, search.trim(), limit, (page - 1) * limit)
      songs = results
      hasMore = results.length === limit
    } else if (albumId) {
      // Get songs by specific album
      const results = await getSongsByAlbum(db, albumId, limit, (page - 1) * limit)
      songs = results
      hasMore = results.length === limit
    } else if (artistId) {
      // Get songs by specific artist
      const results = await getSongsByArtist(db, artistId, limit, (page - 1) * limit)
      songs = results
      hasMore = results.length === limit
    } else {
      // Get paginated list of all songs with artist names
      const results = await getSongsWithArtists(db, limit, (page - 1) * limit)
      songs = results
      hasMore = results.length === limit
    }

    return {
      success: true,
      data: {
        songs,
        pagination: {
          page,
          limit,
          hasMore
        },
        filters: {
          search: search || null,
          artistId: artistId || null,
          albumId: albumId || null
        }
      }
    }
  } catch (error) {
    console.error('Error fetching songs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch songs'
    })
  }
})