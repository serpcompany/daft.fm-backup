<template>
  <ModulePage 
    title="Songs"
    api-endpoint="/api/songs"
    url-prefix="/songs"
    :display-fields="['artistName', 'title']"
  />
</template>