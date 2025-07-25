// SEO utility functions and templates

interface SeoConfig {
  siteName: string
  titleSeparator: string
  defaultDescription: string
  defaultImage: string
}

const seoConfig: SeoConfig = {
  siteName: 'Daft.fm',
  titleSeparator: ' | ',
  defaultDescription: 'Explore a comprehensive music database featuring artists, albums, and songs.',
  defaultImage: '/og-image.png'
}

// Title Templates
export const seoTitleTemplates = {
  home: () => `${seoConfig.siteName} - Music Database | Artists, Albums & Songs`,
  
  artist: (artistName: string) => 
    `${artistName} - Artist${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  album: (albumTitle: string, artistName: string) => 
    `${albumTitle} by ${artistName}${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  song: (songTitle: string, artistName: string) => 
    `${songTitle} by ${artistName}${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  artistListing: () => 
    `Artists - Browse All Musicians${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  albumListing: () => 
    `Albums - Browse All Releases${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  songListing: () => 
    `Songs - Browse All Tracks${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  search: (query?: string) => 
    query 
      ? `Search Results for "${query}"${seoConfig.titleSeparator}${seoConfig.siteName}`
      : `Search${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  error404: () => 
    `Page Not Found${seoConfig.titleSeparator}${seoConfig.siteName}`,
  
  error: () => 
    `Error${seoConfig.titleSeparator}${seoConfig.siteName}`
}

// Description Templates
export const seoDescriptionTemplates = {
  home: () => 
    'Explore a comprehensive music database featuring artists, albums, and songs. Discover new music, browse complete discographies, and find detailed information.',
  
  artist: (artistName: string, country?: string, year?: number, genres?: string[]) => {
    let description = `Learn about ${artistName}`
    if (country) description += ` from ${country}`
    if (year) description += ` (formed ${year})`
    if (genres && genres.length > 0) {
      description += `. Genre: ${genres.slice(0, 3).join(', ')}`
    }
    description += '. Browse albums, songs, and more on Daft.fm.'
    return truncateDescription(description)
  },
  
  album: (albumTitle: string, artistName: string, year?: number, trackCount?: number, duration?: number) => {
    let description = `Listen to ${albumTitle} by ${artistName}`
    if (year) description += ` (${year})`
    if (trackCount) description += `, ${trackCount} tracks`
    if (duration) description += `, ${formatDuration(duration)} total`
    description += '. Full track listing on Daft.fm.'
    return truncateDescription(description)
  },
  
  song: (songTitle: string, artistName: string, albumTitle?: string, year?: number, duration?: number) => {
    let description = `Listen to ${songTitle} by ${artistName}`
    if (albumTitle) description += ` from ${albumTitle}`
    if (year) description += ` (${year})`
    if (duration) description += ` (${formatDuration(duration)})`
    description += '. Lyrics and details on Daft.fm.'
    return truncateDescription(description)
  },
  
  artistListing: (count?: number) => 
    count 
      ? `Browse ${count.toLocaleString()} artists on Daft.fm. Discover musicians and bands from all genres and eras.`
      : 'Browse all artists on Daft.fm. Discover musicians and bands from all genres and eras.',
  
  albumListing: (count?: number) => 
    count
      ? `Explore ${count.toLocaleString()} albums on Daft.fm. Find complete discographies and new releases.`
      : 'Explore all albums on Daft.fm. Find complete discographies and new releases.',
  
  songListing: (count?: number) => 
    count
      ? `Discover ${count.toLocaleString()} songs on Daft.fm. Browse tracks from all genres and time periods.`
      : 'Discover all songs on Daft.fm. Browse tracks from all genres and time periods.',
  
  search: (query: string, resultCount?: number) => 
    resultCount !== undefined
      ? `Found ${resultCount} results for "${query}" on Daft.fm. Search artists, albums, and songs.`
      : `Search results for "${query}" on Daft.fm. Find artists, albums, and songs.`,
  
  error404: () => 
    "The page you're looking for doesn't exist. Browse our music database to find artists, albums, and songs.",
  
  error: () => 
    'Something went wrong. Please try again or browse our music database.'
}

// Utility Functions
function truncateDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength - 3) + '...'
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Canonical URL builder
export function buildCanonicalUrl(path: string): string {
  const baseUrl = 'https://daft.fm'
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Open Graph image selector
export function selectOgImage(images?: string[], defaultImage?: string): string {
  if (images && images.length > 0) {
    return images[0]
  }
  return defaultImage || seoConfig.defaultImage
}

// Twitter Card type selector
export function selectTwitterCard(hasImage: boolean = false): string {
  return hasImage ? 'summary_large_image' : 'summary'
}

// Generate complete SEO meta tags
export function generateSeoMeta(type: string, data: any = {}) {
  const title = getSeoTitle(type, data)
  const description = getSeoDescription(type, data)
  const image = selectOgImage(data.images, data.defaultImage)
  const canonicalUrl = data.canonicalUrl || buildCanonicalUrl(data.path || '/')
  
  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description.substring(0, 200), // OG descriptions can be longer
    ogImage: image,
    ogUrl: canonicalUrl,
    ogType: getOgType(type),
    twitterCard: selectTwitterCard(!!image),
    twitterTitle: title.substring(0, 70), // Twitter has shorter limits
    twitterDescription: description.substring(0, 200),
    twitterImage: image
  }
}

// Get title by type
function getSeoTitle(type: string, data: any): string {
  switch (type) {
    case 'home':
      return seoTitleTemplates.home()
    case 'artist':
      return seoTitleTemplates.artist(data.name || 'Unknown Artist')
    case 'album':
      return seoTitleTemplates.album(
        data.title || 'Unknown Album',
        data.artistName || 'Unknown Artist'
      )
    case 'song':
      return seoTitleTemplates.song(
        data.title || 'Unknown Song',
        data.artistName || 'Unknown Artist'
      )
    case 'artistListing':
      return seoTitleTemplates.artistListing()
    case 'albumListing':
      return seoTitleTemplates.albumListing()
    case 'songListing':
      return seoTitleTemplates.songListing()
    case 'search':
      return seoTitleTemplates.search(data.query)
    case 'error404':
      return seoTitleTemplates.error404()
    default:
      return seoTitleTemplates.error()
  }
}

// Get description by type
function getSeoDescription(type: string, data: any): string {
  switch (type) {
    case 'home':
      return seoDescriptionTemplates.home()
    case 'artist':
      return seoDescriptionTemplates.artist(
        data.name,
        data.country,
        data.formedYear,
        data.genres
      )
    case 'album':
      return seoDescriptionTemplates.album(
        data.title,
        data.artistName,
        data.year,
        data.trackCount,
        data.duration
      )
    case 'song':
      return seoDescriptionTemplates.song(
        data.title,
        data.artistName,
        data.albumTitle,
        data.year,
        data.duration
      )
    case 'artistListing':
      return seoDescriptionTemplates.artistListing(data.count)
    case 'albumListing':
      return seoDescriptionTemplates.albumListing(data.count)
    case 'songListing':
      return seoDescriptionTemplates.songListing(data.count)
    case 'search':
      return seoDescriptionTemplates.search(data.query, data.resultCount)
    case 'error404':
      return seoDescriptionTemplates.error404()
    default:
      return seoDescriptionTemplates.error()
  }
}

// Get Open Graph type
function getOgType(type: string): string {
  switch (type) {
    case 'home':
    case 'artistListing':
    case 'albumListing':
    case 'songListing':
    case 'search':
      return 'website'
    case 'artist':
      return 'profile'
    case 'album':
      return 'music.album'
    case 'song':
      return 'music.song'
    default:
      return 'website'
  }
}