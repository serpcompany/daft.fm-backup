<template>
  <div class="min-h-screen flex flex-col">
    <UHeader 
      title="Daft.fm" 
      to="/"
    >
      <template #left>
        <UNavigationMenu 
          :items="[
            { label: 'Artists', to: '/artists' },
            { label: 'Albums', to: '/albums' },
            { label: 'Songs', to: '/songs' }
          ]"
          variant="link"
        />
      </template>
    </UHeader>

    <main class="flex-1">
      <slot />
    </main>

    <UFooter>
      <template #left>
        <p>&copy; {{ new Date().getFullYear() }} Daft.fm</p>
      </template>
      
      <UNavigationMenu 
        :items="[
          { label: 'About', to: '/about' },
          { label: 'Contact', to: '/contact' }
        ]"
        variant="link"
      />
    </UFooter>
  </div>
</template>