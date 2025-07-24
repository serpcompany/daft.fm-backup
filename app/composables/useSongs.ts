// Song data fetching composables
import type { Song, Artist, Album } from '~/server/types'

interface SongListResponse {
  success: boolean
  data: {
    songs: Song[]
    pagination: {
      page: number
      limit: number
      hasMore: boolean
    }
    filters: {
      search: string | null
      artistId: string | null
      albumId: string | null
    }
  }
}

interface SongResponse {
  success: boolean
  data: {
    song: Song
    artist: Artist
    album: Album | null
  }
}

export const useSongs = () => {
  /**
   * Fetch paginated list of songs with optional search and filtering
   */
  const fetchSongs = async (options: {
    page?: number
    limit?: number
    search?: string
    artistId?: string
    albumId?: string
  } = {}) => {
    const { page = 1, limit = 20, search, artistId, albumId } = options
    
    const query: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString()
    }
    
    if (search) {
      query.search = search
    }
    
    if (artistId) {
      query.artistId = artistId
    }
    
    if (albumId) {
      query.albumId = albumId
    }

    const { data } = await $fetch<SongListResponse>('/api/songs', {
      query
    })

    return data
  }

  /**
   * Fetch single song by slug
   */
  const fetchSong = async (slug: string) => {
    const { data } = await $fetch<SongResponse>(`/api/songs/${slug}`)
    return data
  }

  return {
    fetchSongs,
    fetchSong
  }
}

export const useSong = (slug: string) => {
  return useLazyFetch<SongResponse>(`/api/songs/${slug}`, {
    key: `song-${slug}`,
    transform: (data: SongResponse) => data.data
  })
}

export const useSongsList = (options: {
  page?: Ref<number>
  limit?: Ref<number>
  search?: Ref<string>
  artistId?: Ref<string>
  albumId?: Ref<string>
} = {}) => {
  const { 
    page = ref(1), 
    limit = ref(20), 
    search = ref(''), 
    artistId = ref(''), 
    albumId = ref('')
  } = options

  const query = computed(() => {
    const q: Record<string, string> = {
      page: page.value.toString(),
      limit: limit.value.toString()
    }
    
    if (search.value) {
      q.search = search.value
    }
    
    if (artistId.value) {
      q.artistId = artistId.value
    }
    
    if (albumId.value) {
      q.albumId = albumId.value
    }
    
    return q
  })

  return useLazyFetch<SongListResponse>('/api/songs', {
    key: 'songs-list',
    query,
    transform: (data: SongListResponse) => data.data
  })
}