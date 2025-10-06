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
    autoImport: true,
  },
  routeRules: {
    "/": {
      redirect: "/QueryRunner",
    },
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  compatibilityDate: "2025-07-15",
  $development: {
    devtools: { enabled: true },
  },
  nitro: {
    experimental: {
      websocket: true,
      openAPI: true,
    },
  },
  runtimeConfig: {
    public: {
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
  typescript: {
    typeCheck: true,
  },
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/fontawesome.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/solid.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/regular.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/brands.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/duotone.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/light.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/sharp-light.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/sharp-regular.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/sharp-solid.css",
        },
        {
          rel: "stylesheet",
          href: "https://im.endhealth.co.uk/fonts/css/sharp-thin.css",
        },
      ],
    },
  },
});
