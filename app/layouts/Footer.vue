<template>
  <div id="footer-bar">
    <div id="footer-start">
      <IMFontAwesomeIcon
        icon="fa-duotone fa-cookie-bite"
        :style="'--fa-primary-color: var(--p-orange-900); --fa-secondary-color: var(--p-yellow-500);'"
        class="footer-icon"
        v-tooltip.right="'Cookie settings'"
        @click="showCookieSettings"
        data-testid="cookie-settings-button"
      />
    </div>
    <div id="footer-middle">
      <Button link as="router-link" label="Privacy policy" to="/privacy" class="footer-link" />
      <Button link as="router-link" label="Cookie policy" to="/cookies" class="footer-link" />
    </div>
    <div id="footer-end">
      <Button
        v-tooltip.bottom="'Releases'"
        v-if="currentVersion"
        :label="currentVersion"
        class="p-button-rounded p-button-outlined p-button-plain topbar-end-button"
        @click="showReleaseNotes"
        data-testid="releases-button"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import GithubService from "~/services/GithubService";
import { useSharedStore } from "~/stores/sharedStore";

import { IMFontAwesomeIcon } from "@endeavour/vue-library/components";
import { REPO } from "@endeavour/vue-library/enums";

const sharedStore = useSharedStore();

const currentVersion: Ref<undefined | string> = ref();

onMounted(async () => {
  // await getCurrentVersion();
});

async function getCurrentVersion() {
  const latestRelease = await GithubService.getLatestRelease(REPO.IM_QUERY_RUNNER);
  if (latestRelease && latestRelease.version) currentVersion.value = latestRelease.version;
}

function showReleaseNotes() {
  sharedStore.updateShowReleaseNotes(true);
}

function showCookieSettings() {
  sharedStore.updateShowCookieConsent(true);
}
</script>

<style scoped>
#footer-bar {
  flex: 0 0 auto;
  width: 100%;
  height: 3rem;
  display: flex;
  flex-flow: row nowrap;
  overflow: hidden;
  border-top: 1px solid var(--p-content-border-color);
}

#footer-start {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  padding: 0.5rem;
}

#footer-middle {
  flex: 1 1 auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

#footer-end {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

.footer-icon {
  cursor: pointer;
  font-size: 2rem;
  height: 100%;
}
</style>
