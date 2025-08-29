<template>
  <div>
    <NuxtLoadingIndicator>
      <slot><ProgressSpinner /></slot>
    </NuxtLoadingIndicator>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
