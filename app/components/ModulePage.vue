<template>
  <UContainer>
    <h1>{{ title }}</h1>
    
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="data?.length">
      <ul>
        <li v-for="item in data" :key="item.id">
          <NuxtLink :to="getItemUrl(item)">
            {{ getItemDisplay(item) }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div v-else>No {{ title.toLowerCase() }} found</div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Artist, Album, Song, ArtistsResponse, AlbumsResponse, SongsResponse } from '~/server/types'

interface Props {
  title: string
  apiEndpoint: string
  urlPrefix: string
  displayFields: (keyof Artist | keyof Album | keyof Song)[]
}

const props = defineProps<Props>()

const { data: response, pending, error } = await useFetch<ArtistsResponse | AlbumsResponse | SongsResponse>(props.apiEndpoint)

const data = computed((): (Artist | Album | Song)[] => {
  if (!response.value?.data) return []
  
  // Type-safe handling of different API response structures
  if ('artists' in response.value.data) {
    return response.value.data.artists
  } else if ('albums' in response.value.data) {
    return response.value.data.albums
  } else if ('songs' in response.value.data) {
    return response.value.data.songs
  }
  
  return []
})

function getItemUrl(item: Artist | Album | Song): string {
  return `${props.urlPrefix}/${item.slug}-${item.id}`
}

function getItemDisplay(item: Artist | Album | Song): string {
  return props.displayFields
    .map(field => {
      const value = (item as any)[field]
      if (!value) return null
      
      // Format release date to year only
      if (field === 'releaseDate' && value) {
        return new Date(value).getFullYear()
      }
      
      return value
    })
    .filter(Boolean)
    .join(' - ')
}
</script>