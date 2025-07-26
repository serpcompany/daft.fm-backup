// Cover Art Archive - Album artwork fetcher
// Free API that uses MusicBrainz IDs

export interface CoverArtImage {
  approved: boolean
  back: boolean
  comment: string
  edit: number
  front: boolean
  id: number
  image: string
  thumbnails: {
    250?: string
    500?: string
    1200?: string
    small?: string
    large?: string
  }
  types: string[]
}

export interface CoverArtResponse {
  images: CoverArtImage[]
  release: string
}

export async function fetchAlbumCoverArt(mbid: string): Promise<string[]> {
  try {
    // Try release group first
    let response = await fetch(`https://coverartarchive.org/release-group/${mbid}`)
    
    if (response.status === 404) {
      // Fall back to release ID
      response = await fetch(`https://coverartarchive.org/release/${mbid}`)
      
      if (response.status === 404) {
        return []
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: CoverArtResponse = await response.json()
    
    // Get front cover images, preferring approved ones
    const frontImages = data.images
      .filter(img => img.front && img.approved)
      .sort((a, b) => b.id - a.id) // Latest first
    
    if (frontImages.length === 0) {
      // Fall back to any front image
      const anyFront = data.images.filter(img => img.front)
      if (anyFront.length > 0) {
        return [anyFront[0].image, anyFront[0].thumbnails['500'] || ''].filter(Boolean)
      }
    }
    
    if (frontImages.length > 0) {
      const img = frontImages[0]
      return [
        img.image, // Full size
        img.thumbnails['500'] || '', // Medium
        img.thumbnails['250'] || ''  // Small
      ].filter(Boolean)
    }
    
    return []
  } catch (error) {
    // Silently fail for 404s, log other errors
    if (error instanceof Error && !error.message.includes('404')) {
      console.error(`Error fetching cover art for ${mbid}:`, error.message)
    }
    return []
  }
}