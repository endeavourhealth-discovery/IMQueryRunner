import type { EndSecUI } from "~~/shared/EndSecUI";

import type { User } from "@endeavour/vue-library/models";

import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  globalThis.uiGuard = {
    login: async (): Promise<void> => {
      const reqUrl = useRequestURL();
      const headers = useRequestHeaders();
      const loginUrl = await $fetch("/api/auth/getLoginUrl", {
        query: {
          redirectUri: reqUrl.origin + "/callback",
          state: reqUrl.pathname + reqUrl.search
        },
        headers: headers
      });
      await nuxtApp.runWithContext(() => navigateTo(loginUrl, { external: true }));
    },

    callback: async (code: string, state: string): Promise<void> => {
      const headers = useRequestHeaders();
      const response = await $fetch<User>("/api/auth/login", {
        query: { code: code, state: state },
        headers: headers
      });
      useUserStore().setUser(response);
    },

    getUser: async (): Promise<User> => {
      const headers = useRequestHeaders();
      const response = await $fetch<User>("/api/auth/user", {
        headers: headers
      });
      return response;
    },

    profile: async (): Promise<void> => {
      const profileUrl = await $fetch<string>("/api/auth/getProfileUrl");
      await nuxtApp.runWithContext(() => navigateTo(profileUrl, { external: true }));
    },

    logout: async (): Promise<void> => {
      await $fetch("/api/auth/logout");
      useUserStore().setUser(null);
      reloadNuxtApp();
    },

    isLoggedIn: async (): Promise<boolean> => {
      const headers = useRequestHeaders();
      const result = await $fetch("/api/auth/isLoggedIn", {
        headers: headers
      });
      return result;
    }
  } as EndSecUI;

  nuxtApp.vueApp.config.errorHandler = async (error: any) => {
    if (error instanceof FetchError) {
      const path = error.request instanceof Request ? error.request.url : error.request;

      if (!path) return;

      switch (error.status) {
        case 401: {
          await clearError();
          await globalThis.uiGuard.login();
          break;
        }
        case 403:
          await clearError({ redirect: "/unauthorized" });
          break;
        default:
          await clearError({ redirect: "/error" });
          break;
      }
    }
  };
});
