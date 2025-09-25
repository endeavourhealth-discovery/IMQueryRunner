import { useUser } from "~/composables/useUser";
import { uiGuard } from "~/utils/security/ui.guard";
import Logger from "#shared/logger";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const LOG = Logger("app/middleware/auth")
  if(to.path.startsWith("/api")) {
    LOG.debug("API route, skipping auth")
    return;
  }

  const userStore = useUser();
  LOG.debug(`User is logged in = ${userStore.isLoggedIn.value}`)

  const allowed = (await uiGuard.checkPermission(to.path, "ROUTE")).data.value;
  LOG.debug(`User is allowed = ${allowed}`)

  if (!allowed) {
    if (userStore.isLoggedIn.value) {
      LOG.debug("Already logged in. Redirect to Unauthorized")
      return navigateTo("/unauthorized");
    } else {
      abortNavigation();
      LOG.debug("Not logged in. Redirect to login page")

      const reqUrl = useRequestURL();
      LOG.debug(`Origin = ${reqUrl.origin}`)

      userStore.clearUserCookie();

      const loginUrl = await useFetch("/api/auth/loginUrl", {
        method: "get",
        params: {
          origin: reqUrl.origin,
          redirectUrl: to.path
        }
      });

      LOG.debug(`Navigating to ${loginUrl.data.value}`)

      return navigateTo(loginUrl.data.value, {external: true})
    }
  }
});
