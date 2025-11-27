<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { applyUserSettings } from "@/composables/useApplyUserSettings";
import { useUserSettingsStore } from "~~/stores/usersettings.store";

const userStore = useUser();
const userSettingsStore = useUserSettingsStore();
onMounted(async () => {
  if (!userStore.isLoggedIn.value) {
    try {
      const result = await useFetch("/api/auth/loginWithSessionId", {
        server: true,
      });
      const isLoggedInApi = await useFetch("/api/auth/isLoggedIn", {
        server: true,
      });
      await userSettingsStore.getAllUserSettings();
    } catch (e) {
      console.log("Failed to login using session id");
    }
  }
  if (userStore.isLoggedIn.value) {
    await userSettingsStore.getAllUserSettings();
  }
  applyUserSettings();
});
</script>
