import PrimeVueColors from "@@/enums/PrimeVueColors";
import PrimeVuePresetThemes from "@@/enums/PrimeVuePresetThemes";
import { useUserSettingsStore } from "@@/stores/usersettings.store";
import {
  usePreset,
  updatePrimaryPalette,
  updateSurfacePalette,
  palette,
} from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import Lara from "@primeuix/themes/lara";
import Nora from "@primeuix/themes/nora";
import Material from "@primeuix/themes/material";
import { type PaletteDesignToken } from "@primeuix/themes/types";

function setupChangeThemeOptions() {
  const userSettingsStore = useUserSettingsStore();

  async function changePreset(preset: PrimeVuePresetThemes) {
    switch (preset) {
      case PrimeVuePresetThemes.AURA:
        usePreset(Aura);
        break;
      case PrimeVuePresetThemes.NORA:
        usePreset(Nora);
        break;
      case PrimeVuePresetThemes.LARA:
        usePreset(Lara);
        break;
      case PrimeVuePresetThemes.MATERIAL:
        usePreset(Material);
        break;
      default:
        usePreset(Aura);
        break;
    }
    if (userSettingsStore.currentPrimaryColor)
      await changePrimaryColor(userSettingsStore.currentPrimaryColor);
    if (userSettingsStore.currentSurfaceColor)
      await changeSurfaceColor(userSettingsStore.currentSurfaceColor);
    if (userSettingsStore.darkMode)
      await changeDarkMode(userSettingsStore.darkMode);
    if (preset !== userSettingsStore.currentPreset)
      await userSettingsStore.updateCurrentPreset(preset);
  }

  async function changePrimaryColor(color: PrimeVueColors) {
    const colorPalette = palette(`{${color}}`);
    updatePrimaryPalette(colorPalette as PaletteDesignToken);
    if (color !== userSettingsStore.currentPrimaryColor)
      await userSettingsStore.updateCurrentPrimaryColor(color);
  }

  async function changeSurfaceColor(color: PrimeVueColors) {
    const colorPalette = palette(`{${color}}`);
    updateSurfacePalette(colorPalette as PaletteDesignToken);
    if (color !== userSettingsStore.currentSurfaceColor)
      await userSettingsStore.updateCurrentSurfaceColor(color);
  }

  async function changeDarkMode(bool: boolean) {
    const element = document.querySelector("html");
    const darkMode = element?.classList.contains("my-app-dark");
    if (element && bool !== darkMode) element.classList.toggle("my-app-dark");
    if (userSettingsStore.darkMode !== bool)
      await userSettingsStore.updateDarkMode(bool);
  }

  return {
    changePreset,
    changePrimaryColor,
    changeSurfaceColor,
    changeDarkMode,
  };
}

export default setupChangeThemeOptions;
