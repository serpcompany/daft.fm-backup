<template>
  <ModulePage 
    title="Songs"
    api-endpoint="/api/songs"
    url-prefix="/songs"
    :display-fields="['title', 'duration', 'artistId']"
  />
</template>