import type { ZodSchema } from 'zod'

/**
 * Validates data but doesn't break the app
 * Logs errors in development, returns data either way
 */
export function safeValidate<T>(
  schema: ZodSchema<T>, 
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    // Log the error for monitoring
    console.warn(`Validation warning in ${context}:`, {
      errors: result.error.errors,
      // Don't log full data in production (might have sensitive info)
      sample: process.dev ? data : undefined
    })
    
    // Return the data anyway - better to show something than break
    return data as T
  }
  
  return result.data
}

/**
 * Use this for critical validation that should fail
 */
export function strictValidate<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error(`Validation failed in ${context}:`, error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid data format'
    })
  }
}