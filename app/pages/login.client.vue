<script setup>
const CasdoorSDK = getCasdoorSDK();

async function login() {
  await CasdoorSDK.signin_redirect();
}
</script>

<template>
  <div class="flex-auto flex justify-center items-center">
    <Button @click="login">Login with Casdoor</Button>
  </div>
</template>
