<script setup lang="ts">
import { use } from "h3";
import { useRoute } from "vue-router";
import { useUser } from "~/composables/useUser";
import { useAuth } from "~/composables/useAuth";

const { authenticate } = useAuth();
const route = useRoute();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const code = route.query.code as string;
  if (code) {
    await authenticate(code);
    const { isLoggedIn } = useUser();
    if (!isLoggedIn.value) throw createError("Failed to fetch login session");
    await navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
