// GET /api/albums/lookup - Get album by artist and album slug

import { createDb } from '../../database/db'
import { and, eq } from 'drizzle-orm'
import { albums, artists, songs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const artistSlug = query.artist as string
  const albumSlug = query.album as string
  
  if (!artistSlug || !albumSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both artist and album slug are required'
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
    // First find the artist
    const artistResults = await db.select().from(artists).where(eq(artists.slug, artistSlug)).limit(1)
    
    if (artistResults.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Artist not found'
      })
    }
    
    const artist = artistResults[0]
    
    // Then find the album
    const albumResults = await db.select().from(albums)
      .where(and(
        eq(albums.artistId, artist.id),
        eq(albums.slug, albumSlug)
      ))
      .limit(1)
    
    if (albumResults.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Album not found'
      })
    }
    
    const album = albumResults[0]
    
    // Fetch all songs in the album
    const albumSongs = await db.select().from(songs)
      .where(eq(songs.albumId, album.id))
      .orderBy(songs.title) // Should order by track number when available
    
    return {
      success: true,
      data: {
        album,
        artist,
        songs: albumSongs
      }
    }
  } catch (error) {
    console.error('Error fetching album:', error)
    
    // If it's already an error with a status code, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch album'
    })
  }
})