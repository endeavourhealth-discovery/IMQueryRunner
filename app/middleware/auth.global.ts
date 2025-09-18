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
  const { loggedIn } = useUserSession();
  console.log("UI : isLoggedIn=" + loggedIn.value);

  const allowed = (await uiGuard.checkPermission(to.path, "ROUTE")).data.value;
  console.log(`UI : Permission on route [${to.path}] = ${allowed}`);
  if (!allowed) {
    if (loggedIn.value) {
      console.log(
        "UI : Logged in but no permission, redirecting to unauth page"
      );
      return navigateTo("/unauthorized");
    } else {
      console.log("UI : Not logged in, redirecting to login");
      const config = useRuntimeConfig().public;
      return navigateTo(
        `${config.casdoorUrl}/login/${
          config.casdoorOrganisationName
        }?redirect_uri=${encodeURIComponent(
          `${origin}/callback?redirect=${to.path}`
        )}&response_type=token&client_id=${config.casdoorClientId}`,
        { external: true }
      );
    }
  }
});
