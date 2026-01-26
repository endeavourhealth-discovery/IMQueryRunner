import { useUserStore } from "~/plugins/end-sec-ui"

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("Route Guard")

  const { requiresAuth, requiresRole } = to.meta;
  const userStore = useUserStore();

  if (requiresAuth || requiresRole) {
    if (!userStore.isLoggedIn) {
      return navigateTo(await globalThis.uiGuard.getLoginUrl(), { external: true })
    }

    if (!userStore.hasRole(requiresRole as string[]))
       return navigateTo("/unauthorized");
  }
})