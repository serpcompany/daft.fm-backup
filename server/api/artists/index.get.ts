import { createDb } from '../../database/db'
import { artists } from '../../database/schema'
import { desc, sql } from 'drizzle-orm'

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

  // Get total count
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(artists)
    .get()
  
  const total = totalResult?.count || 0

  // Get paginated artists
  const artistsData = await db.select()
    .from(artists)
    .orderBy(desc(artists.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    data: artistsData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})