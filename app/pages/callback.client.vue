<script setup lang="ts">
import {useRoute} from "vue-router";
import {uiAuth} from "~/utils/security/ui.auth";

const route = useRoute();
const userStore = useUserStore();

onMounted(async () => {
  const redirect = route.query.redirect as string;
  const jwt = route.query.token as string;
  const token = useCookie("jwtToken");

  if (jwt) {
    token.value = jwt;
    const user = uiAuth.getUserFromToken(jwt)
    userStore.updateCurrentUser(user);
    navigateTo(redirect);
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
