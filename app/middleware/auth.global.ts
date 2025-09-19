import { useUser } from "~/composables/useUser";
import { login } from "~/utils/login";
import { uiGuard } from "~/utils/security/ui.guard";

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("UI : to: " + to.path);
  console.log("UI : from: " + from.path);
  // if (to.path === from.path) return;

  const publicRoutes = ["/unauthorized"];
  if (publicRoutes.includes(to.path)) return;

  if (to.path === "/callback") return;

  const reqUrl = useRequestURL();
  const origin = reqUrl.origin;
  const pathname = reqUrl.pathname;
  const { isLoggedIn } = useUser();
  console.log("UI : isLoggedIn=" + isLoggedIn.value);

  const allowed = (await uiGuard.checkPermission(to.path, "ROUTE")).data.value;
  console.log(`UI : Permission on route [${to.path}] = ${allowed}`);
  if (!allowed) {
    if (isLoggedIn.value) {
      console.log(
        "UI : Logged in but no permission, redirecting to unauth page"
      );
      return navigateTo("/unauthorized");
    } else {
      console.log("UI : Not logged in, redirecting to login");
      abortNavigation();
      await login(`${origin}/callback?redirect=${to.path}`);
    }
  }
});
