<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { onMounted } from "vue";
import { useUserStore } from "~/stores/userStore";
import type { User } from "~~/models";
import Cookies from "js-cookie";
import { getUserFromToken } from "~/utils/getUserFromToken";

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
        Cookies.set("casdoorUser", JSON.stringify(res));
        await getUserFromToken(res.access_token);
        console.log("success logged in");
        await navigateTo("/QueryRunner");
      }
    });
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
