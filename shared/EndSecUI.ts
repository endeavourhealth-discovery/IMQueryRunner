import type { User } from "@endeavour/vue-library/models";

export interface EndSecUI {
  login(): Promise<void>;
  callback(code: string, state: string): Promise<void>;
  profile(): Promise<void>;
  logout(): Promise<void>;
  getUser(): Promise<User>;
  isLoggedIn(): Promise<boolean>;
}
