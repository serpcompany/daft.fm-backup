// GET /api/songs/[id] - Get a specific song by ID with artist and album details

import { getSongWithDetails } from '../../lib/queries'
import { createDb } from '../../database/db'

export default defineEventHandler(async (event) => {
  const songId = getRouterParam(event, 'id')
  
  if (!songId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Song ID is required'
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
    const result = await getSongWithDetails(db, songId)
    
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Song not found'
      })
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error fetching song:', error)
    
    // If it's already an error with a status code, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch song details'
    })
  }
})