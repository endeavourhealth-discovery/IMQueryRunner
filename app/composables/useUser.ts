import type { User } from "casdoor-nodejs-sdk/lib/cjs/user";

export function useUser() {
  const isLoggedIn = computed(() => !!user.value);
  const user = useCookie<User | undefined>("casdoor_user");

  function clearUserCookie() {
    user.value = undefined;
  }

  return {
    user,
    isLoggedIn,
    clearUserCookie,
  };
}
