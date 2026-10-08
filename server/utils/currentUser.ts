import type { UserPreferences } from "~~/models/userPreferences.schema";

import type { User } from "@endeavour/vue-library/models";

import type { H3Event } from "h3";

import { getCasdoorUser, updateCasdoorUser } from "./casdoor";
import { fromCasdoorUser, toCasdoorProperties } from "./casdoorUser";

/** The signed-in user, loaded fresh from Casdoor. Throws 401 if there is no session. */
export async function getCurrentUser(event: H3Event): Promise<User> {
  const { user } = await requireUserSession(event);
  return fromCasdoorUser(await getCasdoorUser(user.owner, user.name));
}

/**
 * Applies a partial set of preferences to the signed-in user and returns the updated user.
 * One read and one write against Casdoor (the full-user path above reads twice). Only the fields present in `preferences`
 * change, so concurrent saves of different preferences from the same page do not overwrite each other.
 */
export async function updateCurrentUserPreferences(event: H3Event, preferences: UserPreferences): Promise<User> {
  const { user: sessionUser } = await requireUserSession(event);
  const existing = await getCasdoorUser(sessionUser.owner, sessionUser.name);
  const defined = Object.fromEntries(Object.entries(preferences).filter(([, value]) => value !== undefined));
  const merged = { ...fromCasdoorUser(existing), ...defined } as User;
  const updated = { ...existing, properties: toCasdoorProperties(merged, existing.properties ?? {}) };
  await updateCasdoorUser(updated);
  return fromCasdoorUser(updated);
}

/** Persists the user's preferences to Casdoor and returns the updated user. */
export async function updateCurrentUser(event: H3Event, user: User): Promise<User> {
  const { user: sessionUser } = await requireUserSession(event);
  const existing = await getCasdoorUser(sessionUser.owner, sessionUser.name);
  const updated = { ...existing, properties: toCasdoorProperties(user, existing.properties ?? {}) };
  await updateCasdoorUser(updated);
  return fromCasdoorUser(updated);
}
