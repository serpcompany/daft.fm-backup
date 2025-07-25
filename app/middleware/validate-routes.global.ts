export default defineNuxtRouteMiddleware((to) => {
  // PREVENTION: Global middleware to catch malformed URLs
  
  // Check for undefined in the path
  if (to.path.includes('undefined')) {
    console.error('Route contains undefined:', to.path)
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found'
    })
  }
  
  // Check for null in the path
  if (to.path.includes('null')) {
    console.error('Route contains null:', to.path)
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found'
    })
  }
  
  // Check for double slashes (except after http://)
  if (to.path.match(/(?<!:)\/\//)) {
    console.error('Route contains double slashes:', to.path)
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid URL format'
    })
  }
})