import Cookies from "js-cookie";

export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return;
  const protectedRoutes = ["/QueryRunner"];

  const casdoorUserCookie = Cookies.get("casdoorUser");
  const isAuthenticated = !!casdoorUserCookie;
  if (!isAuthenticated && protectedRoutes.includes(to.path)) {
    return navigateTo("/login");
  }
});
