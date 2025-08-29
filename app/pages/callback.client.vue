<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { onMounted } from "vue";
import { useUserStore } from "~/stores/userStore";
import type { User } from "~~/models";

const route = useRoute();
const router = useRouter();
const CasdoorSDK = getCasdoorSDK();
const userStore = useUserStore();

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state;

  if (code) {
    await CasdoorSDK.exchangeForAccessToken().then(async (res) => {
      if (res && res.access_token) {
        console.log("getting user details");
        const userJson: any = await CasdoorSDK.getUserInfo(res.access_token);
        if (userJson.name && userJson.aud && userJson.sub) {
          const user: User = {
            name: userJson.name,
            id: userJson.aud,
            token: userJson.sub,
          };
          userStore.updateCurrentUser(user);
          console.log("success logged in");
          await navigateTo("/QueryRunner");
        } else {
          throw createError("User is invalid");
        }
      }
    });
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
