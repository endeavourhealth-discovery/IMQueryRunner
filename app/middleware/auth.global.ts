import {uiAuth} from "~/utils/security/ui.auth";
import {uiGuard} from "~/utils/security/ui.guard";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path.startsWith("/api"))
    return;

  const reqUrl = useRequestURL();

  console.log("========= Request URL =========");
  console.log(reqUrl);

  const origin = reqUrl.origin;
  const pathname = reqUrl.pathname;
  const token = useCookie("jwtToken");
  const userStore = useUserStore();

  if ("/callback" != pathname && token.value) {
      const user = uiAuth.getUserFromToken(token.value)
      userStore.updateCurrentUser(user);
  }

  uiAuth.configure(useRuntimeConfig().public);

  const allowed = (await uiGuard.checkPermission(pathname, "ROUTE")).data.value;
  console.log(`UI : Permission on route [${pathname}] = ${allowed}`);
  if (!allowed) {
    if (userStore.isLoggedIn) {
      console.log("UI : Logged in but no permission, redirecting to unauth page")
      return navigateTo("/unauthorized");
    } else {
      console.log("UI : Not logged in, redirecting to login")
      return uiAuth.login(`${origin}/callback?redirect=${to.path}`, `${origin}/unauthorized`);
    }
  }
});
