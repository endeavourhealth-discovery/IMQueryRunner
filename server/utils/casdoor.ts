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

async function casdoorRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; query?: Record<string, string>; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { url, clientId, clientSecret } = useRuntimeConfig().casdoor;
  const response = await ofetch<CasdoorEnvelope<T> | T>(`${url}/api/${path}`, {
    ...options,
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` }
  });

  if (!isEnvelope<T>(response)) return response;
  if (response.status === "error") throw createError({ statusCode: 502, statusMessage: "Casdoor request failed", message: response.msg });
  return response.data as T;
}

export async function getCasdoorUser(owner: string, name: string): Promise<CasdoorUser> {
  const user = await casdoorRequest<CasdoorUser | null>("get-user", { query: { id: `${owner}/${name}` } });
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unknown user", message: `No Casdoor user ${owner}/${name}` });
  return user;
}

/** Replaces only the user's `properties` column; all other fields on the Casdoor user are left untouched. */
export async function updateCasdoorUserProperties(owner: string, name: string, properties: Record<string, string>): Promise<void> {
  await casdoorRequest("update-user", {
    method: "POST",
    query: { id: `${owner}/${name}`, columns: "properties" },
    body: { owner, name, properties }
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
