import type { User } from "~~/models";

export interface UserState {
  currentUser: User | undefined;
}
