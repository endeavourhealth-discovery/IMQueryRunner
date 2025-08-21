<script setup>
import { useRoute, useRouter } from "vue-router";
import { onMounted } from "vue";

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state;

  if (code) {
    try {
      const { data: tokenRes } = await useFetch("/api/auth/casdoor", {
        method: "POST",
        body: { code },
      });

      // Save token or user info as needed
      console.log("Access Token:", tokenRes.access_token);

      router.push("/");
    } catch (e) {
      console.error("Login failed", e);
    }
  }
});
</script>

<template>
  <div>Logging in...</div>
</template>
