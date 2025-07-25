import { z } from 'zod'
import { createDb } from '../database/db'
import { artists, albums, songs } from '../database/schema'
import { like, or, sql, eq } from 'drizzle-orm'

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['all', 'artists', 'albums', 'songs']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(10)
})

export default defineEventHandler(async (event) => {
  const db = createDb(event.context.cloudflare.env.DB)
  try {
    // Parse and validate query parameters
    const query = getQuery(event)
    const { q, type, limit } = searchQuerySchema.parse(query)
    
    // Prepare search term for SQL LIKE
    const searchTerm = `%${q}%`
    
    const results: {
      artists: any[]
      albums: any[]
      songs: any[]
    } = {
      artists: [],
      albums: [],
      songs: []
    }
    
    // Search artists
    if (type === 'all' || type === 'artists') {
      results.artists = await db.select({
        id: artists.id,
        name: artists.name,
        slug: artists.slug,
        country: artists.country,
        formedYear: artists.formedYear,
        images: artists.images
      })
      .from(artists)
      .where(
        or(
          like(artists.name, searchTerm),
          like(artists.slug, searchTerm)
        )
      )
      .limit(limit)
      .all()
    }
    
    // Search albums
    if (type === 'all' || type === 'albums') {
      results.albums = await db.select({
        id: albums.id,
        title: albums.title,
        slug: albums.slug,
        artistId: albums.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
        releaseDate: albums.releaseDate,
        coverArt: albums.coverArt
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(
        or(
          like(albums.title, searchTerm),
          like(albums.slug, searchTerm)
        )
      )
      .limit(limit)
      .all()
    }
    
    // Search songs
    if (type === 'all' || type === 'songs') {
      results.songs = await db.select({
        id: songs.id,
        title: songs.title,
        slug: songs.slug,
        artistId: songs.artistId,
        artistName: artists.name,
        artistSlug: artists.slug,
        albumId: songs.albumId,
        albumTitle: albums.title,
        albumSlug: albums.slug,
        duration: songs.duration
      })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .leftJoin(albums, eq(songs.albumId, albums.id))
      .where(
        or(
          like(songs.title, searchTerm),
          like(songs.slug, searchTerm)
        )
      )
      .limit(limit)
      .all()
    }
    
    // Calculate total results
    const totalResults = results.artists.length + results.albums.length + results.songs.length
    
    return {
      success: true,
      query: q,
      type,
      totalResults,
      results
    }
  } catch (error) {
    console.error('Search error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid search parameters',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})