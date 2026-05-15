<template>
  <div class="flex flex-col w-screen h-screen overflow-auto">
    <DevBanner v-if="isDevMode && showDevBanner" />
    <ReleaseBannerBar v-if="showReleaseBanner" :latestRelease="latestRelease" />
    <Header />
    <slot />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import GithubService from "~/services/GithubService";

import { type GithubRelease, REPO } from "@endeavour/vue-library";

import semver from "semver";

import DevBanner from "./DevBanner.vue";
import Footer from "./Footer.vue";
import ReleaseBannerBar from "./ReleaseBannerBar.vue";

const sharedStore = useSharedStore();

const showReleaseBanner: ComputedRef<boolean | null> = computed(() => sharedStore.showReleaseBanner);
const showDevBanner: ComputedRef<boolean | null> = computed(() => sharedStore.showDevBanner);
const isDevMode: ComputedRef<boolean> = computed(() => sharedStore.isDevMode);

const latestRelease: Ref<GithubRelease | undefined> = ref();

onMounted(async () => {
  // await setShowReleaseBanner();
});

async function setShowReleaseBanner() {
  const lastVersion = getLocalVersion("IMQueryRunnerVersion");
  latestRelease.value = await GithubService.getLatestRelease(REPO.IM_QUERY_RUNNER);
  let currentVersion = "v0.0.0";
  if (latestRelease.value?.version) currentVersion = latestRelease.value.version;
  if (!lastVersion || !semver.valid(lastVersion) || semver.lt(lastVersion, currentVersion)) {
    sharedStore.updateShowReleaseBanner(true);
  } else if (semver.valid(lastVersion) && semver.gt(lastVersion, currentVersion)) {
    localStorage.removeItem("IMQueryRunnerVersion");
    sharedStore.updateShowReleaseBanner(true);
  } else sharedStore.updateShowReleaseBanner(false);
}

function getLocalVersion(storageName: string): string | null {
  return localStorage.getItem(storageName);
}
</script>

<style scoped></style>
