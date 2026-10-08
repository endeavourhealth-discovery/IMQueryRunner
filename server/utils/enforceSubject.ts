import type { User } from "@endeavour/vue-library/models";

/**
 * Builds the `sub` for a Casdoor enforce request from the app's User.
 *
 * Casdoor turns a JSON object into a Go struct (reflect.StructOf), which only allows exported (capitalised) field names,
 * so top-level keys are capitalised (`roles` -> `Roles`) for the enforcer's matcher to read as `r.sub.Roles`.
 * The password is never sent.
 */
export function toEnforceSubject(user: User): Record<string, unknown> {
  const { password: _password, ...rest } = user;
  return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key.charAt(0).toUpperCase() + key.slice(1), value]));
}
