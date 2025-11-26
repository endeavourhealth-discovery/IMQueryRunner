import { defineStore } from "pinia";
import PrimeVueColors from "#shared/enums/PrimeVueColors.ts";
import PrimeVuePresetThemes from "#shared/enums/PrimeVuePresetThemes.ts";

export const useUserSettingsStore = defineStore("userSettings", () => {
  const { isLoggedIn, user } = useUser();

  const currentPreset = ref<PrimeVuePresetThemes>();
  const currentPrimaryColor = ref<PrimeVueColors>();
  const currentSurfaceColor = ref<PrimeVueColors>();
  const darkMode = ref(false);
  const currentScale = ref("14px");

  async function updateCurrentPreset(preset: PrimeVuePresetThemes) {
    currentPreset.value = preset;
    if (isLoggedIn.value) {
      await useFetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor,
          darkMode: darkMode,
          currentScale: currentScale,
        },
      });
    }
  }

  async function updateCurrentPrimaryColor(color: PrimeVueColors) {
    currentPrimaryColor.value = color;
    if (isLoggedIn.value) {
      await useFetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor,
          darkMode: darkMode,
          currentScale: currentScale,
        },
      });
    }
  }

  async function updateCurrentSurfaceColor(color: PrimeVueColors) {
    currentSurfaceColor.value = color;
    if (isLoggedIn.value) {
      await useFetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor,
          darkMode: darkMode,
          currentScale: currentScale,
        },
      });
    }
  }

  async function updateDarkMode(isDarkMode: boolean) {
    darkMode.value = isDarkMode;
    if (isLoggedIn.value) {
      await useFetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor,
          darkMode: darkMode,
          currentScale: currentScale,
        },
      });
    }
  }

  async function updateCurrentScale(fontSize: string) {
    currentScale.value = fontSize;
    if (isLoggedIn.value) {
      await useFetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor,
          darkMode: darkMode,
          currentScale: currentScale,
        },
      });
    }
  }

  function clearAllFromUserSettings() {
    this.currentPreset = PrimeVuePresetThemes.AURA;
    this.currentPrimaryColor = PrimeVueColors.EMERALD;
    this.currentSurfaceColor = PrimeVueColors.SLATE;
    this.darkMode = false;
    this.currentScale = "14px";
  }
  async function getAllUserSettings(): Promise<void> {
    const { isLoggedIn } = useUser();
    if (!isLoggedIn) {
      return;
    }
    const results = await $fetch<{
      preset: string;
      primaryColor: PrimeVueColors;
      surfaceColor: PrimeVueColors;
      darkMode: boolean;
      scale: string;
    }>("/api/user/settings");
    if (results.data?.preset) this.currentPreset = results.data.preset;
    if (results.data?.primaryColor)
      this.currentPrimaryColor = results.data.primaryColor;
    if (results.data?.secondaryColor)
      this.secondaryColor = results.data.secondaryColor;
    if (results.data.darkMode) this.darkMode = results.data.darkMode;
    if (results.data.scale) this.currentScale = results.data.scale;
  }
  return {
    currentPreset,
    currentPrimaryColor,
    currentSurfaceColor,
    darkMode,
    currentScale,
    clearAllFromUserSettings,
    getAllUserSettings,
    updateCurrentPreset,
    updateCurrentPrimaryColor,
    updateCurrentSurfaceColor,
    updateCurrentScale,
    updateDarkMode,
  };
});
