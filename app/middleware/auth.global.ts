import { useUser } from "~/composables/useUser";
import { login } from "~/utils/login";
import { uiGuard } from "~/utils/security/ui.guard";

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("UI : to: " + to.path);
  console.log("UI : from: " + from.path);

  const publicRoutes = ["/callback", "/unauthorized"];
  if (publicRoutes.includes(to.path)) return;

  const reqUrl = useRequestURL();
  const origin = reqUrl.origin;
  const pathname = reqUrl.pathname;

  console.log("UI : to.path  =" + to.path);
  console.log("UI : pathname =" + pathname);

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

      const config = useRuntimeConfig().public;
      const successUrl = `${origin}/callback?redirect=${to.path}`;
      await navigateTo(
        `${config.casdoorUrl}/login/${
          config.casdoorOrganisationName
        }?redirect_uri=${encodeURIComponent(
          successUrl
        )}&response_type=code&client_id=${config.casdoorClientId}`,
        { external: true }
      );
      console.log("===================== Navigated to Login Page =====================");
    }
  }
});
