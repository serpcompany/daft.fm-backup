<template>
  <div>
      <UPage>
        <UPageHeader 
          title="Songs"
          description="Browse all songs in our database"
        />

        <UPageBody>
          <!-- Loading State -->
          <div v-if="pending" class="space-y-2">
            <USkeleton v-for="i in 20" :key="i" class="h-14 w-full" />
          </div>

          <!-- Error State -->
          <UAlert 
            v-else-if="error"
            color="red"
            icon="i-heroicons-exclamation-triangle"
            title="Error loading songs"
            :description="error.message || 'Failed to load songs'"
          />

          <!-- Songs List -->
          <div v-else-if="songs && songs.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
            <NuxtLink
              v-for="song in validSongs"
              :key="song.id"
              :to="song.href"
              class="block py-4 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium">{{ song.title }}</p>
                  <p class="text-sm text-gray-500">
                    <NuxtLink 
                      :to="`/artists/${song.artistSlug}`" 
                      class="hover:underline"
                      @click.stop
                    >
                      {{ song.artistName }}
                    </NuxtLink>
                    <span v-if="song.albumTitle">
                       • 
                      <NuxtLink 
                        :to="`/albums/${song.artistSlug}-${song.albumSlug}`" 
                        class="hover:underline"
                        @click.stop
                      >
                        {{ song.albumTitle }}
                      </NuxtLink>
                    </span>
                    <span v-if="song.duration"> • {{ formatDuration(song.duration) }}</span>
                  </p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
              </div>
            </NuxtLink>
          </div>

          <!-- Empty State -->
          <UCard v-else>
            <div class="text-center py-8">
              <p class="text-2xl font-semibold mb-2">No songs found</p>
              <p class="text-gray-500">No songs are available at the moment.</p>
            </div>
          </UCard>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-8 flex justify-center">
            <UPagination 
              v-model="page" 
              :total="total"
              :page-count="pageSize"
            />
          </div>
        </UPageBody>
      </UPage>
  </div>
</template>

<script setup lang="ts">
import { generateSeoMeta, buildCanonicalUrl } from '~/utils/seo'

const route = useRoute()
const router = useRouter()

// Pagination
const page = ref(Number(route.query.page) || 1)
const pageSize = 50

// Watch for page changes
watch(page, (newPage) => {
  router.push({ query: { ...route.query, page: newPage } })
})

// Fetch songs with artist and album info
const { data, error, pending } = await useFetch('/api/songs', {
  query: {
    page,
    limit: pageSize
  }
})

const songs = computed(() => data.value?.data || [])

// PREVENTION: Filter out songs with invalid data and create safe URLs
const validSongs = computed(() => {
  return songs.value
    .filter(song => {
      // Ensure all required fields exist
      return song.id && 
             song.title && 
             song.slug && 
             song.artistName && 
             song.artistSlug &&
             song.artistSlug !== 'undefined' &&
             song.slug !== 'undefined'
    })
    .map(song => ({
      ...song,
      // Create safe href that we validate
      href: `/songs/${song.artistSlug}-${song.slug}`
    }))
})
const total = computed(() => data.value?.pagination?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// Utility functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// SEO
const seoMeta = computed(() => 
  generateSeoMeta('songListing', {
    count: total.value,
    path: '/songs'
  })
)

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: buildCanonicalUrl('/songs')
    }
  ]
})
</script>