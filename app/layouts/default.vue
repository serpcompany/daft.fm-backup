<template>
  <div class="min-h-screen flex flex-col">
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold">
          DAFT.FM
        </NuxtLink>
      </template>

      <template #right>
        <UHeaderLinks 
          :links="navigationLinks"
          class="hidden lg:flex gap-8"
        />
        <UButton
          icon="i-heroicons-bars-3"
          variant="ghost"
          class="lg:hidden"
          @click="mobileMenuOpen = !mobileMenuOpen"
        />
      </template>

      <template #panel>
        <UNavigationMenu
          v-if="mobileMenuOpen"
          :links="navigationLinks.map(link => ({
            ...link,
            click: () => mobileMenuOpen = false
          }))"
          class="lg:hidden py-4"
        />
      </template>
    </UHeader>

    <main class="flex-1">
      <slot name="hero" />
      <UContainer>
        <slot />
      </UContainer>
    </main>

    <footer class="bg-gray-50 dark:bg-gray-900 mt-20">
      <UContainer>
        <div class="py-8 border-t border-gray-200 dark:border-gray-800">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 class="font-bold text-lg mb-4">DAFT.FM</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Browse</h4>
              <ul class="space-y-2 text-sm">
                <li><NuxtLink to="/artists" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Artists</NuxtLink></li>
                <li><NuxtLink to="/albums" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Albums</NuxtLink></li>
                <li><NuxtLink to="/songs" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Songs</NuxtLink></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Company</h4>
              <ul class="space-y-2 text-sm">
                <li><NuxtLink to="/about" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">About</NuxtLink></li>
                <li><NuxtLink to="/contact" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Contact</NuxtLink></li>
                <li><NuxtLink to="/privacy" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Privacy</NuxtLink></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Connect</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Follow us for updates and new releases.
              </p>
            </div>
          </div>
          
          <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {{ new Date().getFullYear() }} DAFT.FM. All rights reserved.</p>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<script setup>
const mobileMenuOpen = ref(false)

const navigationLinks = [
  {
    label: 'Artists',
    to: '/artists'
  },
  {
    label: 'Albums', 
    to: '/albums'
  },
  {
    label: 'Songs',
    to: '/songs'
  }
]
</script>