import type { User } from "~~/models";
import type { UserState } from "./types/userState";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    currentUser: undefined,
  }),
  getters: {
    isLoggedIn: (state) => (state.currentUser ? true : false),
  },
  actions: {
    updateCurrentUser(user: User | undefined) {
      this.currentUser = user;
    },
  },
});
