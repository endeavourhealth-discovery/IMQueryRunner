import type { User as AppUser } from "@endeavour/vue-library/models";

declare module "#auth-utils" {
  /** Identity held in the sealed session cookie. */
  interface User {
    id: string;
    owner: string;
    name: string;
  }
  interface UserSession {
    loggedInAt: string;
    /** Full user (roles, preferences), added to the session response by the `fetch` hook in server/plugins/session.ts. */
    profile?: AppUser;
  }
}

export {};
