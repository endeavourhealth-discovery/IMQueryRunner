import {uiAuth} from "~/utils/ui.auth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const req = useRequestURL();
  const token = useCookie("jwtToken");
  const userStore = useUserStore();

  if (to.path === "/") {
    console.log("Routing to query runner");
    return navigateTo("/QueryRunner");
  }

  if ("/callback" != req.pathname && token.value) {
      const user = uiAuth.getUserFromToken(token.value)
      userStore.updateCurrentUser(user);
  }

  uiAuth.configure(useRuntimeConfig().public);

  const allowed = (await uiGuard.checkPermission(to.path, "ROUTE")).data.value;
  console.log(`UI : Permission on route [${to.path}] = ${allowed}`);
  if (!allowed) {
    if (userStore.isLoggedIn) {
      console.log("UI : Logged in but no permission, redirecting to unauth page")
      return navigateTo("/unauthorized");
    } else {
      console.log("UI : Not logged in, redirecting to login")
      return uiAuth.login(`${req?.origin}/callback?redirect=${to.path}`, `${req.origin}/unauthorized`);
    }
  }
});
