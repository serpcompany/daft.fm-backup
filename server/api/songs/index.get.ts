import { createDb } from '../../database/db'
import { songs, artists, albums } from '../../database/schema'
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
      .from(songs)
      .get()
    
    const total = totalResult?.count || 0

    // Get paginated songs with artist and album info
    const songsData = await db.select({
      song: songs,
      artist: artists,
      album: albums
    })
      .from(songs)
      .leftJoin(artists, eq(songs.artistId, artists.id))
      .leftJoin(albums, eq(songs.albumId, albums.id))
      .orderBy(desc(songs.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    // Format the response - flatten artist and album info for frontend
    const formattedSongs = songsData.map(({ song, artist, album }) => ({
      ...song,
      artistName: artist?.name || 'Unknown Artist',
      artistSlug: artist?.slug || 'unknown',
      albumTitle: album?.title || null,
      albumSlug: album?.slug || null
    }))

    return {
      data: formattedSongs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error in songs API:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch songs',
      data: error
    })
  }
})