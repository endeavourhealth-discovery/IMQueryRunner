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
  routeRules: {
    "/": {
      redirect: "./QueryRunner"
    }
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  compatibilityDate: "2025-07-15",
  nitro: {
    experimental: {
      websocket: true,
      openAPI: true,
    },
  },
  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL,
      casdoorUrl: process.env.CASDOOR_URL,
      casdoorOrganisationName: process.env.CASDOOR_ORGANISATION_NAME,
      casdoorClientId: process.env.CASDOOR_CLIENT_ID,
      casdoorClientSecret: process.env.CASDOOR_CLIENT_SECRET,
      // cognitoIdentityPoolId: process.env.COGNITO_IDENTITY_POOL,
      // cognitoRegion: process.env.COGNITO_REGION,
      // cognitoUserPool: process.env.COGNITO_USER_POOL,
      // cognitoWebClient: process.env.COGNITO_WEB_CLIENT,
    },
  },
});