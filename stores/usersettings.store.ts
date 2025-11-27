import { defineStore } from "pinia";
import { PrimeVuePresetThemes, PrimeVueColors } from "@@/enums";

export const useUserSettingsStore = defineStore("userSettings", () => {
  const { isLoggedIn } = useUser();

  const currentPreset = ref<PrimeVuePresetThemes>(PrimeVuePresetThemes.AURA);
  const currentPrimaryColor = ref<PrimeVueColors>(PrimeVueColors.EMERALD);
  const currentSurfaceColor = ref<PrimeVueColors>(PrimeVueColors.SLATE);
  const darkMode = ref(false);
  const currentScale = ref("14px");

  async function updateCurrentPreset(preset: PrimeVuePresetThemes) {
    currentPreset.value = preset;
    if (isLoggedIn.value) {
      await $fetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor.value,
          darkMode: darkMode.value,
          currentScale: currentScale.value,
        },
      });
    }
  }

  async function updateCurrentPrimaryColor(color: PrimeVueColors) {
    currentPrimaryColor.value = color;
    if (isLoggedIn.value) {
      await $fetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor.value,
          darkMode: darkMode.value,
          currentScale: currentScale.value,
        },
      });
    }
  }

  async function updateCurrentSurfaceColor(color: PrimeVueColors) {
    currentSurfaceColor.value = color;
    if (isLoggedIn.value) {
      await $fetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor.value,
          darkMode: darkMode.value,
          currentScale: currentScale.value,
        },
      });
    }
  }

  async function updateDarkMode(isDarkMode: boolean) {
    darkMode.value = isDarkMode;
    if (isLoggedIn.value) {
      await $fetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor.value,
          darkMode: darkMode.value,
          currentScale: currentScale.value,
        },
      });
    }
  }

  async function updateCurrentScale(fontSize: string) {
    currentScale.value = fontSize;
    if (isLoggedIn.value) {
      await $fetch("/api/user/settings", {
        method: "post",
        body: {
          currentPreset: currentPreset.value,
          currentPrimaryColor: currentPrimaryColor.value,
          currentSurfaceColor: currentSurfaceColor.value,
          darkMode: darkMode.value,
          currentScale: currentScale.value,
        },
      });
    }
  }

  function clearAllFromUserSettings() {
    currentPreset.value = PrimeVuePresetThemes.AURA;
    currentPrimaryColor.value = PrimeVueColors.EMERALD;
    currentSurfaceColor.value = PrimeVueColors.SLATE;
    darkMode.value = false;
    currentScale.value = "14px";
  }
  async function getAllUserSettings(): Promise<void> {
    const { isLoggedIn } = useUser();
    if (!isLoggedIn) {
      return;
    }
    const headers = useRequestHeaders(["cookie"]);
    const results = await $fetch<{
      currentPreset: PrimeVuePresetThemes;
      currentPrimaryColor: PrimeVueColors;
      currentSurfaceColor: PrimeVueColors;
      darkMode: boolean;
      currentScale: string;
    }>("/api/user/settings", { headers });
    if (results.currentPreset) currentPreset.value = results.currentPreset;
    if (results.currentPrimaryColor)
      currentPrimaryColor.value = results.currentPrimaryColor;
    if (results.currentSurfaceColor)
      currentSurfaceColor.value = results.currentSurfaceColor;
    if (results.darkMode) darkMode.value = results.darkMode;
    if (results.currentScale) currentScale.value = results.currentScale;
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
