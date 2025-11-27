import { useUser } from "~/composables/useUser";
import { uiGuard } from "~/utils/security/ui.guard";
import Logger from "#shared/logger";
import { Action, Resource } from "~~/models/AutoGen";
import { useUserSettingsStore } from "@@/stores/usersettings.store";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const LOG = Logger("app/middleware/auth");
  if (to.path.startsWith("/api")) {
    LOG.debug("API route, skipping auth");
    return;
  }

  const publicRoutes = ["/callback", "/unauthorized"];
  if (publicRoutes.includes(to.path)) return;

  const userStore = useUser();
  const userSettingsStore = useUserSettingsStore();
  LOG.info(`User is logged in = ${userStore.isLoggedIn.value}`);

  if (userStore.isLoggedIn.value) {
    if (to.path === "/QueryRunner") {
      const allowed = await uiGuard.checkPermission(
        Resource.QUERY,
        Action.EXECUTE
      );
      if (!allowed) {
        abortNavigation();
        LOG.debug("Already logged in. Redirect to Unauthorized");
        return navigateTo("/unauthorized");
      }
    }
  } else {
    abortNavigation();
    LOG.debug("Not logged in. Redirect to login page");

    const reqUrl = useRequestURL();
    LOG.debug(`Origin = ${reqUrl.origin}`);

    userStore.clearUserCookie();

    const loginUrl = await useFetch("/api/auth/loginUrl", {
      method: "get",
      params: {
        origin: reqUrl.origin,
        redirectUrl: to.path,
      },
      server: true,
    });
    LOG.debug(`Navigating to ${loginUrl.data.value}`);

    return navigateTo(loginUrl.data.value, { external: true });
  }
});
