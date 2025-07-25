<template>
  <div>
      <UPage>
        <UPageHeader 
          title="Albums"
          description="Browse all albums in our database"
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
            title="Error loading albums"
            :description="error.message || 'Failed to load albums'"
          />

          <!-- Albums List -->
          <div v-else-if="albums && albums.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
            <NuxtLink
              v-for="album in validAlbums"
              :key="album.id"
              :to="album.href"
              class="block py-4 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium">{{ album.title }}</p>
                  <p class="text-sm text-gray-500">
                    <NuxtLink 
                      :to="`/artists/${album.artistSlug}`" 
                      class="hover:underline"
                      @click.stop
                    >
                      {{ album.artistName }}
                    </NuxtLink>
                    <span v-if="album.releaseDate"> • {{ formatYear(album.releaseDate) }}</span>
                    <span v-if="album.trackCount"> • {{ album.trackCount }} tracks</span>
                  </p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
              </div>
            </NuxtLink>
          </div>

          <!-- Empty State -->
          <UCard v-else>
            <div class="text-center py-8">
              <p class="text-2xl font-semibold mb-2">No albums found</p>
              <p class="text-gray-500">No albums are available at the moment.</p>
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

// Fetch albums with artist info
const { data, error, pending } = await useFetch('/api/albums', {
  query: {
    page,
    limit: pageSize
  }
})

const albums = computed(() => data.value?.data || [])

// PREVENTION: Filter out albums with invalid data
const validAlbums = computed(() => {
  return albums.value
    .filter(album => {
      return album.id && 
             album.title && 
             album.slug && 
             album.artistName && 
             album.artistSlug &&
             album.artistSlug !== 'undefined' &&
             album.slug !== 'undefined'
    })
    .map(album => ({
      ...album,
      href: `/albums/${album.artistSlug}-${album.slug}`
    }))
})
const total = computed(() => data.value?.pagination?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// Utility functions
function formatYear(dateString: string | Date | number): string {
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

// SEO
const seoMeta = computed(() => 
  generateSeoMeta('albumListing', {
    count: total.value,
    path: '/albums'
  })
)

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: buildCanonicalUrl('/albums')
    }
  ]
})
</script>