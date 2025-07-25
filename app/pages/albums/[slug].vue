<template>
  <UContainer class="py-8">
    <div v-if="pending">
      <USkeleton class="h-10 w-2/3 mb-4" />
      <USkeleton class="h-6 w-1/3 mb-8" />
      <USkeleton class="h-64 w-full mb-4" />
      <USkeleton class="h-96 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert 
        color="red"
        icon="i-heroicons-exclamation-triangle"
        title="Error loading album"
        :description="error.message || 'Failed to load album details'"
      />
    </div>

    <div v-else-if="album && artist">
      <!-- Album Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Album Cover -->
          <div v-if="albumCoverArt.length > 0" class="md:w-80 flex-shrink-0">
            <img 
              :src="albumCoverArt[0]"
              :alt="`${album.title} album cover`"
              class="w-full rounded-lg shadow-lg"
            />
          </div>
          
          <!-- Album Info -->
          <div class="flex-1">
            <h1 class="text-4xl font-bold mb-2">{{ album.title }}</h1>
            <p class="text-xl text-gray-600 mb-4">
              by 
              <NuxtLink 
                :to="`/artists/${artist.slug}`"
                class="hover:underline"
              >
                {{ artist.name }}
              </NuxtLink>
            </p>
            
            <div class="flex flex-wrap gap-4 text-gray-600">
              <span v-if="album.releaseDate">
                Released {{ formatDate(album.releaseDate) }}
              </span>
              <span v-if="album.trackCount">
                {{ album.trackCount }} tracks
              </span>
              <span v-if="totalDuration">
                {{ formatDuration(totalDuration) }} total
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Album Details -->
      <div class="grid gap-6">
        <!-- Track List -->
        <UCard v-if="songs && songs.length > 0">
          <h2 class="text-2xl font-semibold mb-4">Tracks</h2>
          <div class="divide-y divide-gray-200">
            <NuxtLink
              v-for="(song, index) in songs"
              :key="song.id"
              :to="`/song?artist=${artist.slug}&song=${song.slug}`"
              class="flex items-center gap-4 py-3 px-1 hover:bg-gray-50 transition-colors"
            >
              <span class="text-gray-500 w-8 text-right">{{ index + 1 }}</span>
              <div class="flex-1">
                <h3 class="font-medium">{{ song.title }}</h3>
              </div>
              <span v-if="song.duration" class="text-sm text-gray-500">
                {{ formatDuration(song.duration) }}
              </span>
            </NuxtLink>
          </div>
        </UCard>

        <!-- External Links -->
        <UCard v-if="externalLinks.length > 0">
          <h2 class="text-2xl font-semibold mb-4">Listen on</h2>
          <div class="flex flex-wrap gap-3">
            <UButton 
              v-for="link in externalLinks" 
              :key="link.service"
              :to="link.url"
              target="_blank"
              variant="outline"
              size="sm"
            >
              {{ link.service }}
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <div v-else>
      <UEmptyState 
        title="Album not found"
        description="The album you're looking for doesn't exist."
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Album, Artist, Song } from '~/server/types'

const route = useRoute()
const slug = route.params.slug as string

// Parse the slug to get artist and album parts
const parts = slug.split('-')
let artistSlug = ''
let albumSlug = ''

// Similar to songs, we need to handle the compound slug
// For now, assume a simple split
const midpoint = Math.floor(parts.length / 2)
artistSlug = parts.slice(0, midpoint).join('-')
albumSlug = parts.slice(midpoint).join('-')

const { data, error, pending } = await useFetch(`/api/albums/${slug}`)

// Check for errors and throw with proper status code
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Album not found',
    fatal: true
  })
}

const album = computed(() => data.value?.data?.album as Album | undefined)
const artist = computed(() => data.value?.data?.artist as Artist | undefined)
const songs = computed(() => data.value?.data?.songs as Song[] | undefined)

// Calculate total duration
const totalDuration = computed(() => {
  if (!songs.value) return 0
  return songs.value.reduce((sum, song) => sum + (song.duration || 0), 0)
})

// Parse album cover art
const albumCoverArt = computed(() => {
  if (!album.value?.coverArt) return []
  try {
    return JSON.parse(album.value.coverArt)
  } catch (e) {
    return []
  }
})

// Parse external IDs for links
const externalLinks = computed(() => {
  if (!album.value?.externalIds) return []
  
  try {
    const ids = JSON.parse(album.value.externalIds)
    const links = []
    
    if (ids.spotify_album_id) {
      links.push({ service: 'Spotify', url: `https://open.spotify.com/album/${ids.spotify_album_id}` })
    }
    if (ids.apple_music_album_id) {
      links.push({ service: 'Apple Music', url: `https://music.apple.com/album/${ids.apple_music_album_id}` })
    }
    if (ids.discogs_master_id) {
      links.push({ service: 'Discogs', url: `https://www.discogs.com/master/${ids.discogs_master_id}` })
    }
    if (album.value.id) {
      links.push({ service: 'MusicBrainz', url: `https://musicbrainz.org/release-group/${album.value.id}` })
    }
    
    return links
  } catch (e) {
    return []
  }
})

// Utility functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatDate(dateString: string | Date | number): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

import { generateSeoMeta, buildCanonicalUrl } from '~/utils/seo'

// Dynamic SEO meta tags
const canonicalUrl = computed(() => buildCanonicalUrl(`/albums/${route.params.slug}`))

const seoMeta = computed(() => 
  generateSeoMeta('album', {
    title: album.value?.title,
    artistName: artist.value?.name,
    year: album.value?.releaseDate ? new Date(album.value.releaseDate).getFullYear() : undefined,
    trackCount: album.value?.trackCount,
    duration: totalDuration.value,
    images: albumCoverArt.value,
    path: `/albums/${route.params.slug}`
  })
)

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    }
  ]
})

// JSON-LD structured data
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!album.value || !artist.value) return ''
        
        const musicAlbum = {
          '@context': 'https://schema.org',
          '@type': 'MusicAlbum',
          '@id': canonicalUrl.value,
          name: album.value.title,
          url: canonicalUrl.value,
          ...(album.value.releaseDate && { datePublished: new Date(album.value.releaseDate).toISOString() }),
          ...(album.value.trackCount && { numTracks: album.value.trackCount }),
          ...(albumCoverArt.value.length > 0 && { image: albumCoverArt.value }),
          byArtist: {
            '@type': 'MusicGroup',
            '@id': `https://daft.fm/artists/${artist.value.slug}`,
            name: artist.value.name,
            url: `https://daft.fm/artists/${artist.value.slug}`
          }
        }
        
        // Add external links as sameAs
        const sameAs = []
        if (externalLinks.value.length > 0) {
          externalLinks.value.forEach(link => {
            sameAs.push(link.url)
          })
          musicAlbum.sameAs = sameAs
        }
        
        // Add tracks if available
        if (songs.value && songs.value.length > 0) {
          musicAlbum.track = songs.value.map((song, index) => ({
            '@type': 'MusicRecording',
            '@id': `https://daft.fm/songs/${artist.value.slug}-${song.slug}`,
            position: index + 1,
            name: song.title,
            url: `https://daft.fm/songs/${artist.value.slug}-${song.slug}`,
            ...(song.duration && { duration: `PT${Math.floor(song.duration / 60)}M${song.duration % 60}S` })
          }))
        }
        
        return JSON.stringify(musicAlbum, null, 2)
      }).value
    }
  ]
})

function formatYear(dateString: string | Date | number): string {
  const date = new Date(dateString)
  return date.getFullYear().toString()
}
</script>