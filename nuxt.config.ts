// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: ["@primevue/nuxt-module", "@pinia/nuxt"],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".my-app-dark",
        },
      },
      ripple: true,
    },
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  nitro: {
    experimental: {
      websocket: true,
      openAPI: true,
    },
  },
  runtimeConfig: {
    public: {
      casdoorUrl: process.env.CASDOOR_URL,
      casdoorCredentials: process.env.CASDOOR_CREDENTIALS,
      // cognitoIdentityPoolId: process.env.COGNITO_IDENTITY_POOL,
      // cognitoRegion: process.env.COGNITO_REGION,
      // cognitoUserPool: process.env.COGNITO_USER_POOL,
      // cognitoWebClient: process.env.COGNITO_WEB_CLIENT,
    },
  },
});