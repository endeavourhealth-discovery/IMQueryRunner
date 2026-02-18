import type { User } from "~~/models/User";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => user.value != null);

  function hasRole(roles: string[]): boolean {
    return roles.some((r) => user.value?.roles.includes(r));
  }
  function setUser(u: User | null) {
    user.value = u;
  }

  return {
    user,
    isLoggedIn,
    hasRole,
    setUser,
  };
});
