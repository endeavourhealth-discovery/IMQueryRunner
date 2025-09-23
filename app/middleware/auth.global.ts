import { useUser } from "~/composables/useUser";
import { uiGuard } from "~/utils/security/ui.guard";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if(to.path.startsWith("/api")) {
    return;
  }

  const reqUrl = useRequestURL();
  const pathname = reqUrl.pathname;

  const { isLoggedIn } = useUser();

  const allowed = (await uiGuard.checkPermission(to.path, "ROUTE")).data.value;
  if (!allowed) {
    if (isLoggedIn.value) {
      return navigateTo("/unauthorized");
    } else {
      abortNavigation();

      const loginUrl = await useFetch("/api/auth/loginUrl", {
        method: "get",
        params: {
          origin: reqUrl.origin,
          redirectUrl: to.path
        }
      });

      return navigateTo(loginUrl.data.value, {external: true})
    }
  }
});
