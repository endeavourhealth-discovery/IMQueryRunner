import type { H3Event } from "h3";
import { ofetch } from "ofetch";

import { type StoredTokens, type TokenResponse, needsRefresh, toStoredTokens } from "./tokenLifetime";

/**
 * Casdoor tokens are too large for the session cookie, so they are kept here, keyed by session id. The store is in memory: this app runs as a
 * single instance, and after a restart users simply sign in again.
 */
const tokenStore = () => useStorage<StoredTokens>("auth-tokens");

const refreshesInFlight = new Map<string, Promise<StoredTokens>>();

export async function saveTokens(sessionId: string, tokens: TokenResponse): Promise<void> {
  await tokenStore().setItem(sessionId, toStoredTokens(tokens, Date.now()));
}

export async function deleteTokens(sessionId: string): Promise<void> {
  await tokenStore().removeItem(sessionId);
}

/** A valid Casdoor access token for the signed-in user, refreshed if it is about to expire. Throws 401 if there is no usable session. */
export async function getAccessToken(event: H3Event): Promise<string> {
  const { id } = await requireUserSession(event);
  const tokens = await tokenStore().getItem(id);
  if (!tokens) return await endSession(event, "Your session has expired");
  if (!needsRefresh(tokens, Date.now())) return tokens.accessToken;

  try {
    return (await refresh(id, tokens)).accessToken;
  } catch {
    return await endSession(event, "Your session has expired");
  }
}

async function endSession(event: H3Event, message: string): Promise<never> {
  const { id } = await getUserSession(event);
  await deleteTokens(id);
  await clearUserSession(event);
  throw createError({ statusCode: 401, statusMessage: "Unauthorized", message });
}

/** Concurrent requests for the same session share one refresh (the refresh token may be single use). */
function refresh(sessionId: string, tokens: StoredTokens): Promise<StoredTokens> {
  const existing = refreshesInFlight.get(sessionId);
  if (existing) return existing;

  const pending = (async () => {
    if (!tokens.refreshToken) throw new Error("No refresh token");
    const { url, clientId, clientSecret } = useRuntimeConfig().casdoor;
    const response = await ofetch<TokenResponse>(`${url}/api/login/oauth/access_token`, {
      method: "POST",
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refreshToken, client_id: clientId, client_secret: clientSecret })
    });
    if (!response.access_token) throw new Error("Casdoor returned no access token");

    const refreshed = toStoredTokens(response, Date.now(), tokens);
    await tokenStore().setItem(sessionId, refreshed);
    return refreshed;
  })().finally(() => refreshesInFlight.delete(sessionId));

  refreshesInFlight.set(sessionId, pending);
  return pending;
}
