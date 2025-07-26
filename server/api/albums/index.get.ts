import { createDb } from '../../database/db'
import { albums, artists } from '../../database/schema'
import { desc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 50
  const offset = (page - 1) * limit

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
    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(albums)
      .get()
    
    const total = totalResult?.count || 0

    // Get paginated albums with artist info
    const albumsData = await db.select({
      album: albums,
      artist: artists
    })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .orderBy(desc(albums.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    // Format the response - flatten artist info for frontend
    const formattedAlbums = albumsData.map(({ album, artist }) => ({
      ...album,
      artistName: artist?.name || 'Unknown Artist',
      artistSlug: artist?.slug || 'unknown'
    }))

    return {
      data: formattedAlbums,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error in albums API:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch albums',
      data: error
    })
  }
})