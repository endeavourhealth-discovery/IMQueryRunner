import { ofetch } from "ofetch";

import type { CasdoorUser } from "./casdoorUser";

/** Casdoor wraps most responses as { status, msg, data }. */
interface CasdoorEnvelope<T> {
  status: "ok" | "error";
  msg?: string;
  data?: T;
}

function isEnvelope<T>(response: unknown): response is CasdoorEnvelope<T> {
  if (typeof response !== "object" || response === null || !("status" in response)) return false;
  return response.status === "ok" || response.status === "error";
}

async function casdoorRequest<T>(path: string, options: { method?: "GET" | "POST"; query?: Record<string, string>; body?: object } = {}): Promise<T> {
  const { url, clientId, clientSecret } = useRuntimeConfig().casdoor;
  const credentials = `${clientId}:${clientSecret}`;
  const response = await ofetch<CasdoorEnvelope<T> | T>(`${url}/api/${path}`, {
    ...options,
    headers: { Authorization: `Basic ${Buffer.from(credentials).toString("base64")}` }
  });

  if (!isEnvelope<T>(response)) return response;
  if (response.status === "error")
    throw createError({ statusCode: 502, statusMessage: "Casdoor request failed", message: `${url}/api/${path}: ${response.msg}` });
  return response.data as T;
}

export async function getCasdoorUser(owner: string, name: string): Promise<CasdoorUser> {
  const user = await casdoorRequest<CasdoorUser | null>("get-user", { query: { id: `${owner}/${name}` } });
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unknown user", message: `No Casdoor user ${owner}/${name}` });
  return user;
}

/** Takes the complete user as returned by get-user. Without `id`, Casdoor falls back to the caller's own (application) identity. */
export async function updateCasdoorUser(user: CasdoorUser): Promise<void> {
  await casdoorRequest("update-user", { method: "POST", query: { id: `${user.owner}/${user.name}` }, body: user });
}

/** Asks a Casdoor (casbin) enforcer whether `sub` may perform `act` on `obj`. */
export async function casdoorEnforce(enforcerId: string, sub: object, obj: string, act: string): Promise<boolean> {
  // Casdoor answers with one boolean per enforcer evaluated
  const results = await casdoorRequest<boolean[]>("enforce", { method: "POST", query: { enforcerId }, body: [sub, obj, act] });
  return results.length > 0 && results.every(Boolean);
}

/** RFC 7662 introspection result (the fields we use). Casdoor answers `{ active: false }` for an expired, revoked or unknown token. */
export interface TokenIntrospection {
  active: boolean;
  exp?: number;
  username?: string;
  sub?: string;
}

/** Asks Casdoor whether an access token is valid. Unlike the other calls this is a plain form POST, not the { status, data } envelope. */
export async function introspectAccessToken(token: string): Promise<TokenIntrospection> {
  const { url, clientId, clientSecret } = useRuntimeConfig().casdoor;
  return await ofetch<TokenIntrospection>(`${url}/api/login/oauth/introspect`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` },
    body: new URLSearchParams({ token, token_type_hint: "access_token" })
  });
}

/** An application access token for server-to-server calls (RabbitMQ worker, etc.). */
export async function getClientCredentialsToken(clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number }> {
  const { url } = useRuntimeConfig().casdoor;
  return await ofetch<{ access_token: string; expires_in: number }>(`${url}/api/login/oauth/access_token`, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret })
  });
}
