<script setup lang="ts">
import { useRoute } from "vue-router";
import { useUser } from "~/composables/useUser";

const route = useRoute();

onMounted(async () => {
  console.log("======================= EXCHANGING CODE ==================================")
  const state = route.query.state as string;
  const code = route.query.code as string;

  const reqUrl = useRequestURL();

  if (code) {
    await useFetch("/api/auth/authenticate", { query: { code: code, redirectUri: reqUrl.origin + "/callback" } });
    const { isLoggedIn } = useUser();
    if (!isLoggedIn.value) throw createError("Failed to fetch login session");
    await navigateTo(state);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
