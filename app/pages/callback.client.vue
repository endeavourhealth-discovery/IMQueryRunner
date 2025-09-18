<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const { fetch, loggedIn } = useUserSession();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const jwt = route.query.token as string;
  if (jwt) {
    await useFetch("/api/auth/login", {
      async onRequest({ request, options }) {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${jwt}`);
        options.headers = headers;
      },
    });
    await fetch();
    if (!loggedIn.value) throw createError("Failed to fetch login session");
    console.log("UI : navigating to :" + redirect);
    await navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
