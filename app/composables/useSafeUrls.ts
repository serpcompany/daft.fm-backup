/**
 * PREVENTION: Composable for generating safe URLs
 * This ensures we never generate URLs with undefined or invalid values
 */
export const useSafeUrls = () => {
  const generateArtistUrl = (slug?: string) => {
    if (!slug || slug === 'undefined' || slug === 'null') {
      console.error('Invalid artist slug:', slug)
      return '#' // Safe fallback
    }
    return `/artists/${slug}`
  }

  const generateAlbumUrl = (artistSlug?: string, albumSlug?: string) => {
    if (!artistSlug || !albumSlug || 
        artistSlug === 'undefined' || albumSlug === 'undefined' ||
        artistSlug === 'null' || albumSlug === 'null') {
      console.error('Invalid album URL params:', { artistSlug, albumSlug })
      return '#'
    }
    return `/albums/${artistSlug}-${albumSlug}`
  }

  const generateSongUrl = (artistSlug?: string, songSlug?: string) => {
    if (!artistSlug || !songSlug || 
        artistSlug === 'undefined' || songSlug === 'undefined' ||
        artistSlug === 'null' || songSlug === 'null') {
      console.error('Invalid song URL params:', { artistSlug, songSlug })
      return '#'
    }
    return `/songs/${artistSlug}-${songSlug}`
  }

  const isValidSlug = (slug?: string): boolean => {
    if (!slug || typeof slug !== 'string') return false
    if (slug === 'undefined' || slug === 'null') return false
    if (slug.length === 0 || slug.length > 100) return false
    // Only allow lowercase letters, numbers, and hyphens
    return /^[a-z0-9-]+$/.test(slug)
  }

  return {
    generateArtistUrl,
    generateAlbumUrl,
    generateSongUrl,
    isValidSlug
  }
}