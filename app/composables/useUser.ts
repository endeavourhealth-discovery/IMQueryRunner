import type { User } from "~~/models/User";

export function useUser() {
  const isLoggedIn = computed(() => !!user.value);
  const user = useCookie<User | undefined>("user_session");

  function clearUserCookie() {
    user.value = undefined;
  }

  return {
    user,
    isLoggedIn,
    clearUserCookie,
  };
}
