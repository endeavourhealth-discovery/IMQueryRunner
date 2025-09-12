import { login } from "~/utils/login";
import { uiGuard } from "~/utils/security/ui.guard";

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("UI : to: " + to.path);
  console.log("UI : from: " + from.path);
  // if (to.path === from.path) return;
  if (to.path.startsWith("/api")) return;

  const publicRoutes = ["/unauthorized"];
  if (publicRoutes.includes(to.path)) return;

  if (to.path === "/callback") return;

  const reqUrl = useRequestURL();
  const origin = reqUrl.origin;
  const pathname = reqUrl.pathname;
  const { loggedIn } = useUserSession();
  console.log("UI : isLoggedIn=" + loggedIn.value);

  const allowed = (await uiGuard.checkPermission(pathname, "ROUTE")).data.value;
  console.log(`UI : Permission on route [${pathname}] = ${allowed}`);
  if (!allowed) {
    if (loggedIn.value) {
      console.log(
        "UI : Logged in but no permission, redirecting to unauth page"
      );
      return navigateTo("/unauthorized");
    } else {
      console.log("UI : Not logged in, redirecting to login");
      return login(
        `${origin}/callback?redirect=${to.path}`,
        `${origin}/unauthorized`
      );
    }
  }
});
