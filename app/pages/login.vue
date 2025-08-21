<script setup>
import { CasdoorSDK, Cookies } from "~/plugins/casdoor";

const login = async () => {
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
};
</script>

<template>
  <button @click="login">Login with Casdoor</button>
</template>
