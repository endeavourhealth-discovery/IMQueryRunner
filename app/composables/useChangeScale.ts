import { useUserSettingsStore } from "@@/stores/usersettings.store";

function setupChangeScale() {
  const userSettingsStore = useUserSettingsStore();

  async function changeScale(newScale: string) {
    const currentScale = document.documentElement.style.fontSize || "14px";
    if (newScale !== currentScale) {
      document.documentElement.style.fontSize = newScale;
      await userSettingsStore.updateCurrentScale(newScale);
    }
  }

  return { changeScale };
}

export default setupChangeScale;
