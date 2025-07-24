// GET /api/songs/[slug] - Get song by slug
// URL format: /api/songs/daft-punk-one-more-time-s1a2b3c4-d5e6-7890-1234-567890abcdef

import { getSongByMbid, getArtistByMbid, getAlbumByMbid } from '../../lib/queries'
import { parseSongSlug } from '../../lib/urls'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Song slug is required'
    })
  }

  // Parse the MBID from the slug
  const parsed = parseSongSlug(slug)
  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid song slug format'
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
    // Get the song from database
    const song = await getSongByMbid(db, parsed.mbid)
    
    if (!song) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Song not found'
      })
    }

    // Also fetch the artist and album information
    const [artist, album] = await Promise.all([
      getArtistByMbid(db, song.artistId),
      song.albumId ? getAlbumByMbid(db, song.albumId) : null
    ])
    
    if (!artist) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Artist not found for song'
      })
    }

    return {
      success: true,
      data: {
        song,
        artist,
        album
      }
    }
  } catch (error) {
    console.error('Error fetching song:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch song'
    })
  }
})