import Cookies from "js-cookie";
import { useUserStore } from "~/stores/userStore";

export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return;
  const userStore = useUserStore();
  const protectedRoutes = ["/QueryRunner"];

  const isLoggedIn = userStore.isLoggedIn;
  if (!isLoggedIn && protectedRoutes.includes(to.path)) {
    return navigateTo("/login");
  }
});
