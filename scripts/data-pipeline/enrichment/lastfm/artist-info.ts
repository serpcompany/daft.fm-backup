// Last.fm - Artist info fetcher
// Gets artist bios, images, and tags

export interface LastFmImage {
  '#text': string
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega'
}

export interface LastFmTag {
  name: string
  url: string
}

export interface LastFmArtistInfo {
  artist: {
    name: string
    mbid: string
    url: string
    image: LastFmImage[]
    stats: {
      listeners: string
      playcount: string
    }
    tags: {
      tag: LastFmTag[]
    }
    bio: {
      published: string
      summary: string
      content: string
    }
  }
}

export async function fetchArtistInfo(apiKey: string, artistName: string): Promise<{
  bio?: string
  images?: string[]
  tags?: string[]
}> {
  try {
    const params = new URLSearchParams({
      method: 'artist.getinfo',
      artist: artistName,
      api_key: apiKey,
      format: 'json'
    })

    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: LastFmArtistInfo = await response.json()
    
    if (!data.artist) {
      return {}
    }

    const artist = data.artist

    // Extract bio (remove HTML tags and Last.fm attribution)
    let bio = artist.bio?.content || artist.bio?.summary || ''
    bio = bio
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/Read more on Last\.fm.*$/, '') // Remove Last.fm attribution
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Extract images (prefer larger sizes)
    const images = artist.image
      ?.filter(img => img['#text'] && img['#text'].length > 0)
      .sort((a, b) => {
        const sizeOrder = ['mega', 'extralarge', 'large', 'medium', 'small']
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
      })
      .map(img => img['#text'])
      .slice(0, 3) // Keep top 3 sizes

    // Extract tags/genres
    const tags = artist.tags?.tag
      ?.map(tag => tag.name)
      .slice(0, 10) // Limit to 10 tags

    return {
      bio: bio || undefined,
      images: images?.length ? images : undefined,
      tags: tags?.length ? tags : undefined
    }
  } catch (error) {
    console.error(`Error fetching Last.fm data for ${artistName}:`, error)
    return {}
  }
}