<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const jwt = route.query.token as string;
  console.log(jwt);
  if (jwt) {
    await useFetch("/api/auth/login", {
      async onRequest({ request, options }) {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${jwt}`);
        options.headers = headers;
      },
    });
    console.log("UI : navigating to :" + redirect);
    navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
