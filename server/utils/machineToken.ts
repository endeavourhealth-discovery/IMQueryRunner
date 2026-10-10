import { type StoredTokens, needsRefresh, toStoredTokens } from "./tokenLifetime";

let cached: StoredTokens | undefined;
let pending: Promise<StoredTokens> | undefined;

/**
 * An access token for this application itself (client credentials), for work done outside a user's request such as the RabbitMQ worker.
 * Uses CLIENT_ID/CLIENT_SECRET if set, otherwise the application's own Casdoor credentials. IMAPI sees an application, not a person.
 */
export async function getMachineAccessToken(): Promise<string> {
  if (cached && !needsRefresh(cached, Date.now())) return cached.accessToken;

  pending ??= (async () => {
    const config = useRuntimeConfig().casdoor;
    const response = await getClientCredentialsToken(process.env.CLIENT_ID ?? config.clientId, process.env.CLIENT_SECRET ?? config.clientSecret);
    if (!response.access_token) throw new Error("Casdoor returned no access token");
    cached = toStoredTokens(response, Date.now());
    return cached;
  })().finally(() => (pending = undefined));

  return (await pending).accessToken;
}
