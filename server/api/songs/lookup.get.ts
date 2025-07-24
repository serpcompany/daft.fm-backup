// GET /api/songs/lookup - Get a song by artist and song slug

import { createDb } from '../../database/db'
import { and, eq } from 'drizzle-orm'
import { songs, artists, albums } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const artistSlug = query.artist as string
  const songSlug = query.song as string
  
  if (!artistSlug || !songSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both artist and song slug are required'
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
    
    // Then find the song
    const songResults = await db.select().from(songs)
      .where(and(
        eq(songs.artistId, artist.id),
        eq(songs.slug, songSlug)
      ))
      .limit(1)
    
    if (songResults.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Song not found'
      })
    }
    
    const song = songResults[0]
    
    // Fetch album if exists
    let album = null
    if (song.albumId) {
      const albumResults = await db.select().from(albums).where(eq(albums.id, song.albumId)).limit(1)
      album = albumResults[0] || null
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
    
    // If it's already an error with a status code, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch song'
    })
  }
})