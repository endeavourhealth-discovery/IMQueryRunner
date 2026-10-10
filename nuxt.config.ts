// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";

const IM_FONTS_ORIGIN = "https://im.endhealth.co.uk";

// Only the Font Awesome styles the app and @endeavour/vue-library actually use (solid, regular, duotone).
// Each entry is a render-blocking request: before adding a style (light, brands, sharp-*, thin), check it is really used.
const FONT_AWESOME_STYLES = ["fontawesome", "solid", "regular", "duotone"];

export default defineNuxtConfig({
  modules: ["@primevue/nuxt-module", "@pinia/nuxt", "nuxt-auth-utils"],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".my-app-dark"
        }
      },
      ripple: true
    },
    autoImport: true
  },
  routeRules: {
    "/": {
      redirect: "/QueryRunner"
    }
  },
  css: ["~/assets/css/main.css", "@endeavour/vue-library/components.css"],
  vite: {
    plugins: [tailwindcss()]
  },
  compatibilityDate: "2025-07-15",
  $development: {
    devtools: { enabled: true }
  },
  nitro: {
    scheduledTasks: {
      //[process.env.QUERY_KILL_INTERVAL_CRON as string]: ['kill-queries']
      //[process.env.QUERY_RUNTIME_DAILY_CRON as string]: ['run-query-daily']
    },
    experimental: {
      websocket: true,
      openAPI: true,
      tasks: true
    }
  },
  runtimeConfig: {
    casdoor: {
      url: process.env.CASDOOR_URL,
      organisation: process.env.CASDOOR_ORGANISATION_NAME,
      clientId: process.env.CASDOOR_CLIENT_ID,
      clientSecret: process.env.CASDOOR_CLIENT_SECRET,
      // Casdoor casbin enforcer (owner/name) consulted for authorisation, e.g. Endeavour/TestEnforcer
      enforcerId: process.env.CASDOOR_ENFORCER_ID
    },
    oauth: {
      oidc: {
        clientId: process.env.CASDOOR_CLIENT_ID,
        clientSecret: process.env.CASDOOR_CLIENT_SECRET,
        openidConfig: `${process.env.CASDOOR_URL}/.well-known/openid-configuration`,
        scope: ["openid", "profile", "email"],
        redirectURL: process.env.CASDOOR_REDIRECT_URL
      }
    },
    session: {
      maxAge: 60 * 60 * 24 * 30,
      // Set NUXT_SESSION_COOKIE_SECURE=false only when serving over plain http (browsers drop Secure cookies there, breaking login with "state mismatch")
      cookie: { secure: true }
    },
    public: {
      casdoorUrl: process.env.CASDOOR_URL,
      imapiUrl: process.env.IMAPI_URL,
      imDirectoryUrl: process.env.IM_DIRECTORY_URL
    }
  },
  typescript: {
    typeCheck: true
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en"
      },
      link: [
        // The stylesheets and the font files they reference are fetched with different credential modes, which use separate connections
        { rel: "preconnect", href: IM_FONTS_ORIGIN },
        { rel: "preconnect", href: IM_FONTS_ORIGIN, crossorigin: "anonymous" },
        ...FONT_AWESOME_STYLES.map(style => ({ rel: "stylesheet" as const, href: `${IM_FONTS_ORIGIN}/fonts/css/${style}.css` }))
      ]
    }
  }
});
