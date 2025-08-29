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
      casdoorClientId: "",
      casdoorUrl: "",
      casdoorClientSecret: "",
    },
  },
});