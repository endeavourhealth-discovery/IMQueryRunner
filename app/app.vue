<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <Transition v-if="routerLoading">
        <div class="loading-overlay">
          <ProgressSpinner />
        </div>
      </Transition>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog />
    <Toast />
    <ReleaseNotes v-if="showReleaseNotes && initialLoadComplete" />
    <CookiesConsent v-if="initialLoadComplete" />
  </div>
</template>

<script setup lang="ts">
import { type GithubRelease, REPO, injectionKeysVueLibrary, useChangeFontSize, useChangeThemeOptions, useUserStore } from "@endeavour/vue-library";

import semver from "semver";

import ReleaseNotes from "./components/ReleaseNotes.vue";
import CookiesConsent from "./layouts/CookiesConsent.vue";
import GithubService from "./services/GithubService";
import StatusService from "./services/StatusService";
import UserService from "./services/UserService";

const sharedStore = useSharedStore();
const loadingStore = useLoadingStore();
const userStore = useUserStore();
const { changeFontSize } = useChangeFontSize();
const { changeDarkMode, changePreset, changePrimaryColor, changeSurfaceColor } = useChangeThemeOptions();

const showReleaseNotes: ComputedRef<boolean> = computed(() => sharedStore.showReleaseNotes);
const isDevMode = computed(() => sharedStore.isDevMode);
const currentFontSize = computed(() => userStore.currentFontSize);
const currentPreset = computed(() => userStore.currentPreset);
const currentPrimaryColor = computed(() => userStore.currentPrimaryColor);
const currentSurfaceColor = computed(() => userStore.currentSurfaceColor);
const darkMode = computed(() => userStore.darkMode);
const isLoggedIn = computed(() => userStore.isLoggedIn);
const routerLoading = computed(() => loadingStore.routerLoading);

const latestRelease: Ref<GithubRelease | undefined> = ref();
const initialLoadComplete = ref(false);

const nuxtApp = useNuxtApp();

nuxtApp.hook("page:start", () => {
  loadingStore.updateRouterLoading(true);
});

nuxtApp.hook("page:finish", () => {
  loadingStore.updateRouterLoading(false);
});

watch(currentPreset, async (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) await changePreset(newValue);
});
watch(currentFontSize, async (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) await changeFontSize(newValue);
});
watch(currentPrimaryColor, async (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) await changePrimaryColor(newValue);
});
watch(currentSurfaceColor, async (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) await changeSurfaceColor(newValue);
});
watch(darkMode, async (newValue, oldValue) => {
  if (newValue !== oldValue) await changeDarkMode(newValue);
});

onMounted(async () => {
  initialLoadComplete.value = false;
  if (!userStore.isLoggedIn) {
    const result = await globalThis.uiGuard.isLoggedIn();
    if (result) {
      const user = await globalThis.uiGuard.getUser();
      userStore.updateCurrentUser(user);
    } else console.log("No user session found");
  }

  await setModes();

  if (isLoggedIn.value) {
    userStore.getAllFromUserDatabase();
    await setThemeOptions();
    if (currentFontSize.value) await changeFontSize(currentFontSize.value);
    await setShowReleaseBanner();
  }
  initialLoadComplete.value = true;
});

async function setThemeOptions() {
  if (currentPreset.value) await changePreset(currentPreset.value);
  if (currentPrimaryColor.value) await changePrimaryColor(currentPrimaryColor.value);
  if (currentSurfaceColor.value) await changeSurfaceColor(currentSurfaceColor.value);
  if (darkMode.value) await changeDarkMode(darkMode.value);
}

async function setShowReleaseBanner() {
  const lastVersion = getLocalVersion("IMQueryRunner");
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

function getLocalVersion(repoName: string): string | null {
  return localStorage.getItem(repoName + "Version");
}

async function setModes() {
  if (typeof isDevMode.value === "undefined") {
    const devMode = await StatusService.isDevMode();
    if (typeof devMode != "undefined") {
      sharedStore.updateIsDevMode(devMode);
      if (sharedStore.showDevBanner === null) sharedStore.updateShowDevBanner(true);
    }
  } else if (sharedStore.showDevBanner === null) {
    sharedStore.updateShowDevBanner(true);
  }
}
</script>

<style lang="css" scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  font-size: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
