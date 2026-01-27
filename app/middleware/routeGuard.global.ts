import { useUserStore } from "~/plugins/end-sec-ui"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { requiresAuth, requiresRole } = to.meta;
  const userStore = useUserStore();

  if (requiresAuth || requiresRole) {
    if (!userStore.isLoggedIn) {
      return globalThis.uiGuard.login()
    }

    if (!userStore.hasRole(requiresRole as string[]))
       return navigateTo("/unauthorized");
  }
})