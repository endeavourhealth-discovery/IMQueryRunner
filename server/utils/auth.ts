import type { H3Event } from "h3";
import { createHash } from "node:crypto";

import { introspectAccessToken } from "./casdoor";

/** Who is calling. `id` is what jobs are stored against. */
export interface AuthUser {
  id: string;
  owner: string;
  name: string;
}

export interface Principal {
  user: AuthUser;
  /** True when the caller is a Casdoor application (client credentials), not a person */
  machine: boolean;
  /** Set when the caller authenticated with `Authorization: Bearer`; it is passed on to IMAPI as is */
  bearerToken?: string;
}

/** How long a successful introspection is trusted, so a burst of calls does not hit Casdoor each time. Revocation takes effect within this. */
const INTROSPECTION_TTL_MS = 30_000;
const MAX_CACHED = 1000;

const cache = new Map<string, { principal: Principal; expiresAt: number }>();

export function parseBearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "");
  return match?.[1];
}

/** Reads the payload of a JWT. The signature is not checked here: Casdoor has already vouched for the token by introspection. */
export function decodeJwtClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Casdoor's JWT carries the signed-in user (owner, name, id, type). For client credentials that "user" is the application, with type "application". */
export function principalFromClaims(claims: Record<string, unknown>, bearerToken: string): Principal | undefined {
  const { owner, name, id, type } = claims;
  if (typeof owner !== "string" || typeof name !== "string") return undefined;

  const machine = type === "application";
  // An application has no user record to take an id from, so its identity is its Casdoor owner/name
  const userId = machine ? `${owner}/${name}` : id;
  if (typeof userId !== "string") return undefined;

  return { user: { id: userId, owner, name }, machine, bearerToken };
}

function unauthorised(message: string): never {
  throw createError({ statusCode: 401, statusMessage: "Unauthorized", message });
}

async function authenticateBearer(token: string): Promise<Principal> {
  const key = createHash("sha256").update(token).digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.principal;
  cache.delete(key);

  let introspection;
  try {
    introspection = await introspectAccessToken(token);
  } catch {
    throw createError({ statusCode: 502, statusMessage: "Casdoor request failed", message: "Could not validate the access token" });
  }
  if (!introspection.active) unauthorised("Invalid or expired access token");

  const principal = principalFromClaims(decodeJwtClaims(token), token);
  if (!principal) unauthorised("Access token does not identify a user or application");

  const tokenExpiry = introspection.exp ? introspection.exp * 1000 : Infinity;
  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, { principal, expiresAt: Math.min(Date.now() + INTROSPECTION_TTL_MS, tokenExpiry) });
  return principal;
}

/**
 * The caller of this request, by either route: `Authorization: Bearer <Casdoor access token>` (machine-to-machine, or any client that holds a
 * token), otherwise the nuxt-auth-utils session cookie (the Nuxt frontend). A bearer token that is present but invalid is rejected, not
 * ignored in favour of a cookie. Throws 401 if the caller cannot be identified.
 */
export async function requireAuth(event: H3Event): Promise<Principal> {
  if (event.context.principal) return event.context.principal as Principal;

  const bearer = parseBearerToken(getRequestHeader(event, "authorization"));
  let principal: Principal;
  if (bearer) {
    principal = await authenticateBearer(bearer);
  } else {
    const { user } = await requireUserSession(event);
    principal = { user: { id: user.id, owner: user.owner, name: user.name }, machine: false };
  }

  event.context.principal = principal;
  return principal;
}

/** Test hook: forget validated tokens. */
export function clearTokenCache(): void {
  cache.clear();
}
