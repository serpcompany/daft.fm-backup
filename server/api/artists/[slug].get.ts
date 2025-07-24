// GET /api/artists/[slug] - Get artist by slug
// URL format: /api/artists/daft-punk-056e4f3e-d505-4dad-8ec1-d04f521cbb56

import { getArtistByUrlSlug } from '../../lib/queries'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const urlSlug = getRouterParam(event, 'slug')
  
  if (!urlSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Artist URL slug is required'
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
    // Get the artist from database by URL slug
    const artist = await getArtistByUrlSlug(db, urlSlug)
    
    if (!artist) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Artist not found'
      })
    }

    return {
      success: true,
      data: artist
    }
  } catch (error) {
    console.error('Error fetching artist:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch artist'
    })
  }
})