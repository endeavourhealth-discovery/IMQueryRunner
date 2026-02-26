import { isArray } from "lodash-es";
import { useUserStore } from "~/stores/useUserStore";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { requiresAuth, requiresRole } = to.meta;
  const userStore = useUserStore();

  if (requiresAuth || (isArray(requiresRole) && requiresRole.length > 0)) {
    if (!userStore.isLoggedIn) {
      const result = await globalThis.uiGuard.isLoggedIn();
      if (result) {
        const user = await globalThis.uiGuard.getUser();
        userStore.setUser(user);
      } else return globalThis.uiGuard.login();
    }

    if (!userStore.hasRole(requiresRole as string[]))
      return navigateTo("/unauthorized");
  }
});
