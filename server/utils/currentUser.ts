import type { User } from "@endeavour/vue-library/models";

import type { H3Event } from "h3";

import { getCasdoorUser, updateCasdoorUser } from "./casdoor";
import { fromCasdoorUser, toCasdoorProperties } from "./casdoorUser";

/** The signed-in user, loaded fresh from Casdoor. Throws 401 if there is no session. */
export async function getCurrentUser(event: H3Event): Promise<User> {
  const { user } = await requireUserSession(event);
  return fromCasdoorUser(await getCasdoorUser(user.owner, user.name));
}

/** Persists the user's preferences to Casdoor and returns the updated user. */
export async function updateCurrentUser(event: H3Event, user: User): Promise<User> {
  const { user: sessionUser } = await requireUserSession(event);
  const existing = await getCasdoorUser(sessionUser.owner, sessionUser.name);
  const updated = { ...existing, properties: toCasdoorProperties(user, existing.properties ?? {}) };
  await updateCasdoorUser(updated);
  return fromCasdoorUser(updated);
}
