// Album data fetching composables
import type { Album, Artist } from '~/server/types'

interface AlbumListResponse {
  success: boolean
  data: {
    albums: Album[]
    pagination: {
      page: number
      limit: number
      hasMore: boolean
    }
    filters: {
      search: string | null
      artistId: string | null
    }
  }
}

interface AlbumResponse {
  success: boolean
  data: {
    album: Album
    artist: Artist
  }
}

export const useAlbums = () => {
  /**
   * Fetch paginated list of albums with optional search and filtering
   */
  const fetchAlbums = async (options: {
    page?: number
    limit?: number
    search?: string
    artistId?: string
  } = {}) => {
    const { page = 1, limit = 20, search, artistId } = options
    
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

    const { data } = await $fetch<AlbumListResponse>('/api/albums', {
      query
    })

    return data
  }

  /**
   * Fetch single album by slug
   */
  const fetchAlbum = async (slug: string) => {
    const { data } = await $fetch<AlbumResponse>(`/api/albums/${slug}`)
    return data
  }

  return {
    fetchAlbums,
    fetchAlbum
  }
}

export const useAlbum = (slug: string) => {
  return useLazyFetch<AlbumResponse>(`/api/albums/${slug}`, {
    key: `album-${slug}`,
    transform: (data: AlbumResponse) => data.data
  })
}

export const useAlbumsList = (options: {
  page?: Ref<number>
  limit?: Ref<number>
  search?: Ref<string>
  artistId?: Ref<string>
} = {}) => {
  const { page = ref(1), limit = ref(20), search = ref(''), artistId = ref('') } = options

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
    
    return q
  })

  return useLazyFetch<AlbumListResponse>('/api/albums', {
    key: 'albums-list',
    query,
    transform: (data: AlbumListResponse) => data.data
  })
}