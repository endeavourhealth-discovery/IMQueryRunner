<script setup lang="ts">
import { useRoute } from "vue-router";
import { useUser } from "~/composables/useUser";

const route = useRoute();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const code = route.query.code as string;
  if (code) {
    await useFetch("/api/auth/authenticate", { query: { code: code } });
    const isLoggedInApi = await useFetch("/api/auth/isLoggedIn");
    const { isLoggedIn } = useUser();
    if (!isLoggedIn.value) throw createError("Failed to fetch login session");
    await navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
