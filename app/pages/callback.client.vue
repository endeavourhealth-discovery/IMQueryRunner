<script setup lang="ts">
import {useRoute} from "vue-router";
import { useUserStore } from "~/plugins/end-sec-ui";

const route = useRoute();

onMounted(async () => {
  const userStore = useUserStore();
  const state = route.query.state as string;
  const code = route.query.code as string;
  if (code) {
    await globalThis.uiGuard.callback(code, state);
    if (!userStore.isLoggedIn){
      throw createError("Failed to fetch login session");
    }
    await navigateTo(state);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
