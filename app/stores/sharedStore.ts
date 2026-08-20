import { ref } from "vue";

import { localStorageWithExpiry } from "@endeavour/vue-library/helpers";

import { isString } from "lodash-es";
import { defineStore } from "pinia";

export const useSharedStore = defineStore("shared", () => {
  const showReleaseNotes = ref<boolean>(false);
  const showReleaseBanner = ref<boolean | null>(
    import.meta.client
      ? localStorageWithExpiry.getItem("showQRReleaseBanner", isString) === "true"
        ? true
        : localStorageWithExpiry.getItem("showQRReleaseBanner", isString) === "false"
          ? false
          : null
      : null
  );
  const showDevBanner = ref<boolean | null>(
    import.meta.client
      ? localStorageWithExpiry.getItem("showQRDevBanner", isString) === "true"
        ? true
        : localStorageWithExpiry.getItem("showQRDevBanner", isString) === "false"
          ? false
          : null
      : null
  );
  const showCookieConsent = ref<boolean>(false);
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

  function updateShowCookieConsent(bool: boolean) {
    showCookieConsent.value = bool;
  }

  function updateIsDevMode(devMode: boolean) {
    isDevMode.value = devMode;
  }

  return {
    isDevMode,
    showDevBanner,
    showReleaseBanner,
    showReleaseNotes,
    showCookieConsent,
    updateIsDevMode,
    updateShowDevBanner,
    updateShowReleaseBanner,
    updateShowReleaseNotes,
    updateShowCookieConsent
  };
});
