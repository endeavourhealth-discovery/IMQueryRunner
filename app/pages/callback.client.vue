<script setup lang="ts">
import { useRoute } from "vue-router";
import { useUser } from "~/composables/useUser";

const route = useRoute();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const code = route.query.code as string;
  console.log("UI : code = " + code);
  if (code) {
    console.log("UI : redirecting to login api");
    await $fetch("/api/auth/login", { query: { code: code } });
    console.log("UI : logged in, checking session status... ");
    const { isLoggedIn } = useUser();
    if (!isLoggedIn.value) throw createError("Failed to fetch login session");
    console.log("UI : navigating to :" + redirect);
    await navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
