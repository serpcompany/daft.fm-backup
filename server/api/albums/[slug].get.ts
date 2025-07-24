// GET /api/albums/[slug] - Get album by slug
// URL format: /api/albums/daft-punk-discovery-47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c

import { getAlbumByMbid, getArtistByMbid } from '../../lib/queries'
import { parseAlbumSlug } from '../../lib/urls'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Album slug is required'
    })
  }

  // Parse the MBID from the slug
  const parsed = parseAlbumSlug(slug)
  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid album slug format'
    })
  }

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
    // Get the album from database
    const album = await getAlbumByMbid(db, parsed.mbid)
    
    if (!album) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Album not found'
      })
    }

    // Also fetch the artist information
    const artist = await getArtistByMbid(db, album.artistId)
    
    if (!artist) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Artist not found for album'
      })
    }

    return {
      success: true,
      data: {
        album,
        artist
      }
    }
  } catch (error) {
    console.error('Error fetching album:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch album'
    })
  }
})