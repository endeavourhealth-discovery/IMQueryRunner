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
  login(): Promise<void>
  callback(code: string, state: string): Promise<void>
  profile(): Promise<void>
  logout(): Promise<void>
}

export default defineNuxtPlugin((nuxtApp) => {
  globalThis.uiGuard = {
    login: async (): Promise<void> => {
      const req = useRequestEvent()?.node?.req
      const ip = req?.headers['x-real-ip']?.[0] || req?.headers['x-forwarded-for']?.[0] || req?.socket?.remoteAddress || "0.0.0.0"
      const reqUrl = useRequestURL()
      const loginUrl = await $fetch("/api/auth/getLoginUrl", {
        headers: {"x-client-ip": ip},
        query: {
          redirectUri: reqUrl.origin + "/callback",
          state: reqUrl.pathname + reqUrl.search
        }
      })
      await nuxtApp.runWithContext(() => navigateTo(loginUrl, { external: true }))
    },

    callback: async (code: string, state: string): Promise<void> => {
      const req = useRequestEvent()?.node?.req
      const ip = req?.headers['x-real-ip']?.[0] || req?.headers['x-forwarded-for']?.[0] || req?.socket?.remoteAddress || "0.0.0.0"
      const response = await $fetch("/api/auth/login", {
        headers: {"x-client-ip": ip},
        query: {code: code, state: state}
      })
      useUserStore().setUser(response as User)
    },

    profile: async(): Promise<void> => {
      const profileUrl = await $fetch("/api/auth/getProfileUrl")
      await nuxtApp.runWithContext(() => navigateTo(profileUrl, { external: true }))
    },

    logout: async (): Promise<void> => {
      await $fetch("/api/auth/logout")
      useUserStore().setUser(null);
      reloadNuxtApp()
    },
  } as EndSecUI

  nuxtApp.vueApp.config.errorHandler = async (error: any) => {
    if (error instanceof FetchError) {
      const path = (error.request instanceof Request) ? error.request.url : error.request;

      if (!path) return;

      switch (error.status) {
        case 401: {
          await clearError()
          await globalThis.uiGuard.login()
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
