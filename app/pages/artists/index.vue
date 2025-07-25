<template>
  <div>
    <UContainer>
      <UPage>
        <UPageHeader 
          title="Artists"
          description="Browse all artists in our database"
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
            title="Error loading artists"
            :description="error.message || 'Failed to load artists'"
          />

          <!-- Artists List -->
          <div v-else-if="artists && artists.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
            <NuxtLink
              v-for="artist in artists"
              :key="artist.id"
              :to="`/artists/${artist.slug}`"
              class="block py-4 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ artist.name }}</p>
                  <p class="text-sm text-gray-500" v-if="artist.country || artist.formedYear">
                    {{ [artist.country, artist.formedYear].filter(Boolean).join(' • ') }}
                  </p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
              </div>
            </NuxtLink>
          </div>

          <!-- Empty State -->
          <UCard v-else>
            <div class="text-center py-8">
              <p class="text-2xl font-semibold mb-2">No artists found</p>
              <p class="text-gray-500">No artists are available at the moment.</p>
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
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { Artist } from '~/server/types'
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

// Fetch artists
const { data, error, pending } = await useFetch('/api/artists', {
  query: {
    page,
    limit: pageSize
  }
})

const artists = computed(() => data.value?.data as Artist[] || [])
const total = computed(() => data.value?.pagination?.total || 0)
const totalPages = computed(() => Math.ceil(total.value / pageSize))

// SEO
const seoMeta = computed(() => 
  generateSeoMeta('artistListing', {
    count: total.value,
    path: '/artists'
  })
)

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: buildCanonicalUrl('/artists')
    }
  ]
})
</script>