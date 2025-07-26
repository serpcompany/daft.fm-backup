// Genius - Lyrics fetcher
// Gets song lyrics and annotations

export interface GeniusSearchResult {
  response: {
    hits: Array<{
      type: string
      result: {
        id: number
        title: string
        url: string
        lyrics_state: string
        primary_artist: {
          id: number
          name: string
        }
      }
    }>
  }
}

export interface GeniusSong {
  response: {
    song: {
      id: number
      title: string
      url: string
      lyrics?: string
      description?: {
        plain: string
      }
      song_relationships?: Array<{
        type: string
        songs: Array<{
          id: number
          title: string
        }>
      }>
    }
  }
}

export async function searchSong(token: string, query: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GeniusSearchResult = await response.json()
    
    if (data.response.hits.length > 0) {
      return data.response.hits[0].result.id
    }

    return null
  } catch (error) {
    console.error(`Error searching Genius for "${query}":`, error)
    return null
  }
}

export async function fetchSongDetails(token: string, songId: number): Promise<{
  lyrics?: string
  annotations?: string
}> {
  try {
    const response = await fetch(`https://api.genius.com/songs/${songId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GeniusSong = await response.json()
    const song = data.response.song

    // Note: Genius API doesn't return lyrics directly
    // You need to scrape them from the URL or use a third-party service
    // For now, we'll return the URL and description
    return {
      lyrics: song.url, // URL to lyrics page
      annotations: song.description?.plain
    }
  } catch (error) {
    console.error(`Error fetching Genius song ${songId}:`, error)
    return {}
  }
}