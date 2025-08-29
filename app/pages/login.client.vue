<script setup>
const CasdoorSDK = getCasdoorSDK();

async function login() {
  await CasdoorSDK.signin_redirect().then(async () => {
    await CasdoorSDK.exchangeForAccessToken()
      .then((res) => {
        if (res && res.access_token) {
          return CasdoorSDK.getUserInfo(res.access_token);
        }
      })
      .then((res) => {
        Cookies.set("casdoorUser", JSON.stringify(res));
      });
  });
}
</script>

<template>
  <div class="flex-auto flex justify-center items-center">
    <Button @click="login">Login with Casdoor</Button>
  </div>
</template>
