<script setup lang="ts">
import {useRoute} from "vue-router";
import { useUserStore } from "~/plugins/end-sec-ui";

const route = useRoute();

onMounted(async () => {
  const userStore = useUserStore();
  const state = route.query.state as string;
  const code = route.query.code as string;
  if (code) {
    console.log("Callback received code: ", code, " state: ", state);
    await globalThis.uiGuard.callback(code, state);
    console.log("Callback completed");

    if (!userStore.isLoggedIn){
      throw createError("Failed to fetch login session");
    }

    console.log("User logged in", userStore.user);

    await navigateTo(state);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
