import Cookies from "js-cookie";
import { useUserStore } from "~/stores/userStore";
import { getUserFromToken } from "~/utils/getUserFromToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("auth middleware");
  const userStore = useUserStore();
  const protectedRoutes = ["/QueryRunner"];

  const casdoorUserCookie = Cookies.get("casdoorUser");
  const isLoggedIn = computed(() => userStore.isLoggedIn);
  if (!!casdoorUserCookie && !isLoggedIn.value) {
    const token = JSON.parse(casdoorUserCookie).access_token;
    await getUserFromToken(token);
  }
  if (!isLoggedIn.value && protectedRoutes.includes(to.path)) {
    return navigateTo("/login");
  }
});
