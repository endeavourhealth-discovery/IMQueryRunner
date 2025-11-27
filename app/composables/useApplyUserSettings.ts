import { useUserSettingsStore } from "~~/stores/usersettings.store";

export function applyUserSettings() {
  const userSettingsStore = useUserSettingsStore();
  const { changeScale } = useChangeScale();
  const {
    changeDarkMode,
    changePreset,
    changePrimaryColor,
    changeSurfaceColor,
  } = useChangeThemeOptions();
  changePreset(userSettingsStore.currentPreset);
  changePrimaryColor(userSettingsStore.currentPrimaryColor);
  changeSurfaceColor(userSettingsStore.currentSurfaceColor);
  changeDarkMode(userSettingsStore.darkMode);
  changeScale(userSettingsStore.currentScale);
}
