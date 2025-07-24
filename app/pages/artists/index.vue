<template>
  <ModulePage 
    title="Artists"
    api-endpoint="/api/artists"
    url-prefix="/artists"
    :display-fields="['name', 'country', 'formedYear']"
  />
</template>