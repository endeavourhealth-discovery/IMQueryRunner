import { FetchError } from "ofetch";
import type {User} from "~~/models/User";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => user.value != null)

  function hasRole(roles: string[]): boolean {
    return roles.some(r => user.value?.roles.includes(r))
  }
  function setUser(u: User | null) {
    user.value = u
  }

  return {
    user,
    isLoggedIn,
    hasRole,
    setUser
  }
})

interface EndSecUI {
  getLoginUrl(): Promise<string>
  callback(code: string, state: string): Promise<void>
  logout(): Promise<void>
}

export default defineNuxtPlugin((nuxtApp) => {
  globalThis.uiGuard = {
    getLoginUrl: async (): Promise<string> => {
      const reqUrl = useRequestURL()
      return await $fetch("/api/auth/getLoginUrl", {
        query: {
          redirectUri: reqUrl.origin + "/callback",
          state: reqUrl.pathname + reqUrl.search
        }
      })
    },

    callback: async (code: string, state: string): Promise<void> => {
      const response = await $fetch("/api/auth/login", {query: {code: code, state: state}})
      useUserStore().setUser(response as User)
    },

    logout: async (): Promise<void> => {
      await $fetch("/api/auth/logout")
      useUserStore().setUser(null);
    },
  } as EndSecUI

  nuxtApp.vueApp.config.errorHandler = async (error: any) => {
    if (error instanceof FetchError) {
      const path = (error.request instanceof Request) ? error.request.url : error.request;

      if (!path) return;

      switch (error.status) {
        case 401: {
          await clearError()
          await navigateTo(await globalThis.uiGuard.getLoginUrl(), { external: true })
          break;
        }
        case 403:
          await clearError({redirect: "/unauthorized"})
          break;
        default:
          await clearError({redirect: "/error"})
          break;
      }
    }
  }
})
