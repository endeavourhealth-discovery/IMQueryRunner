import { ref } from "vue";

import { localStorageWithExpiry } from "@endeavour/vue-library";

import { defineStore } from "pinia";

export const useSharedStore = defineStore("shared", () => {
  const showReleaseNotes = ref<boolean>(false);
  const showReleaseBanner = ref<boolean>(import.meta.client ? (localStorageWithExpiry.getItem("showQRReleaseBanner") === "true" ? true : false) : false);
  const showDevBanner = ref<boolean>(import.meta.client ? (localStorageWithExpiry.getItem("showQRDevBanner") === "true" ? true : false) : false);
  const isDevMode = ref<boolean>(true);

  function updateShowReleaseNotes(bool: boolean) {
    showReleaseNotes.value = bool;
  }

  function updateShowReleaseBanner(bool: boolean) {
    showReleaseBanner.value = bool;
    if (import.meta.client) {
      localStorage.setItem("showQRReleaseBanner", bool === true ? "true" : "");
    }
  }

  function updateShowDevBanner(bool: boolean) {
    showDevBanner.value = bool;
    if (import.meta.client) {
      localStorageWithExpiry.setItem("showQRDevBanner", bool);
    }
  }

  function updateIsDevMode(devMode: boolean) {
    isDevMode.value = devMode;
  }

  return {
    isDevMode,
    showDevBanner,
    showReleaseBanner,
    showReleaseNotes,
    updateIsDevMode,
    updateShowDevBanner,
    updateShowReleaseBanner,
    updateShowReleaseNotes
  };
});
