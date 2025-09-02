import Cookies from "js-cookie";
import { useUserStore } from "~/stores/userStore";
import { getUserFromToken } from "~/utils/getUserFromToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  const userStore = useUserStore();
  const protectedRoutes = ["/QueryRunner"];

  const casdoorUserCookie = Cookies.get("casdoorUser");
  const isLoggedIn = userStore.isLoggedIn;

  if (!!casdoorUserCookie && !isLoggedIn) {
    const token = JSON.parse(casdoorUserCookie).access_token;
    console.log(casdoorUserCookie);
    await getUserFromToken(token);
  }
  if (!!casdoorUserCookie && protectedRoutes.includes(to.path)) {
    return navigateTo("/login");
  }
});
