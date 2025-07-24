// Artist data fetching composables
import type { Artist } from '~/server/types'

interface ArtistListResponse {
  success: boolean
  data: {
    artists: Artist[]
    pagination: {
      page: number
      limit: number
      hasMore: boolean
    }
    search: string | null
  }
}

interface ArtistResponse {
  success: boolean
  data: Artist
}

export const useArtists = () => {
  /**
   * Fetch paginated list of artists with optional search
   */
  const fetchArtists = async (options: {
    page?: number
    limit?: number
    search?: string
  } = {}) => {
    const { page = 1, limit = 20, search } = options
    
    const query: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString()
    }
    
    if (search) {
      query.search = search
    }

    const { data } = await $fetch<ArtistListResponse>('/api/artists', {
      query
    })

    return data
  }

  /**
   * Fetch single artist by slug
   */
  const fetchArtist = async (slug: string) => {
    const { data } = await $fetch<ArtistResponse>(`/api/artists/${slug}`)
    return data
  }

  return {
    fetchArtists,
    fetchArtist
  }
}

export const useArtist = (slug: string) => {
  return useLazyFetch<ArtistResponse>(`/api/artists/${slug}`, {
    key: `artist-${slug}`,
    transform: (data: ArtistResponse) => data.data
  })
}

export const useArtistsList = (options: {
  page?: Ref<number>
  limit?: Ref<number>
  search?: Ref<string>
} = {}) => {
  const { page = ref(1), limit = ref(20), search = ref('') } = options

  const query = computed(() => {
    const q: Record<string, string> = {
      page: page.value.toString(),
      limit: limit.value.toString()
    }
    
    if (search.value) {
      q.search = search.value
    }
    
    return q
  })

  return useLazyFetch<ArtistListResponse>('/api/artists', {
    key: 'artists-list',
    query,
    transform: (data: ArtistListResponse) => data.data
  })
}