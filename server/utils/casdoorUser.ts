import { NAMESPACE } from "@endeavour/vue-library/enums";
import { type User, UserSchema } from "@endeavour/vue-library/models";

/** The subset of a Casdoor user record this app reads or writes. */
export interface CasdoorUser {
  owner: string;
  name: string;
  id: string;
  type: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  roles?: { name: string }[] | null;
  properties?: Record<string, string> | null;
  /** Other Casdoor fields, which must be passed back unchanged on update. */
  [key: string]: unknown;
}

const AVATAR_BASE_URL = "https://im.endhealth.co.uk/avatars";

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function avatarUrl(avatar: string | undefined): string {
  if (!avatar) return `${AVATAR_BASE_URL}/colour/001-man.png`;
  return avatar.startsWith("http") ? avatar : `${AVATAR_BASE_URL}/${avatar}`;
}

/** Maps a Casdoor user (identity, roles and the preferences held in `properties`) onto the app's User. */
export function fromCasdoorUser(casdoorUser: CasdoorUser): User {
  const properties = casdoorUser.properties ?? {};
  return UserSchema.parse({
    id: casdoorUser.id,
    type: casdoorUser.type,
    username: casdoorUser.name,
    displayName: casdoorUser.displayName || undefined,
    email: casdoorUser.email ?? "",
    avatar: avatarUrl(casdoorUser.avatar),
    roles: (casdoorUser.roles ?? []).map(role => role.name),
    theme: properties.theme,
    primaryColor: properties.primaryColor,
    surfaceColor: properties.surfaceColor,
    darkMode: properties.darkMode === "true",
    fontSize: properties.fontSize,
    favourites: parseJson(properties.favourites, []),
    recentActivity: parseJson(properties.recentActivity, []),
    organisations: parseJson(properties.organisations, [NAMESPACE.IM]),
    namespaces: parseJson(properties.namespaces, [{ iri: NAMESPACE.IM, read: true, write: false }])
  });
}

/**
 * Encodes a User's preferences as Casdoor `properties` (string values), keeping any properties this app doesn't own.
 * `namespaces` and `organisations` are deliberately never written: namespaces drive authorisation, so users must not be able to set their own.
 */
export function toCasdoorProperties(user: User, existing: Record<string, string> = {}): Record<string, string> {
  return {
    ...existing,
    theme: user.theme,
    primaryColor: user.primaryColor,
    surfaceColor: user.surfaceColor,
    darkMode: String(user.darkMode),
    fontSize: user.fontSize,
    favourites: JSON.stringify(user.favourites ?? []),
    recentActivity: JSON.stringify(user.recentActivity)
  };
}
