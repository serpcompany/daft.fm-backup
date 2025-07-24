<template>
  <ModulePage 
    title="Albums"
    api-endpoint="/api/albums"
    url-prefix="/albums"
    :display-fields="['artistName', 'title']"
  />
</template>