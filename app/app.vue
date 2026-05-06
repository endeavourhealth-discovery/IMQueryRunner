<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog />
    <Toast />
    <ReleaseNotes v-if="showReleaseNotes" />
  </div>
</template>

<script setup lang="ts">
import ReleaseNotes from "./components/ReleaseNotes.vue";

const sharedStore = useSharedStore();

const showReleaseNotes: ComputedRef<boolean> = computed(() => sharedStore.showReleaseNotes);
</script>
