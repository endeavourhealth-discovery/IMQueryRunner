/** What Casdoor's token endpoint returns (the fields we use). */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds */
  expiresAt: number;
}

/** Used when Casdoor does not say how long the token lives. */
const DEFAULT_LIFETIME_SECONDS = 300;

/** Renew this long before expiry so a token never expires mid-request. */
export const REFRESH_SKEW_MS = 30_000;

export function toStoredTokens(response: TokenResponse, now: number, previous?: StoredTokens): StoredTokens {
  return {
    accessToken: response.access_token,
    // Casdoor may not issue a new refresh token on refresh; keep using the old one
    refreshToken: response.refresh_token ?? previous?.refreshToken,
    expiresAt: now + (response.expires_in ?? DEFAULT_LIFETIME_SECONDS) * 1000
  };
}

export function needsRefresh(tokens: StoredTokens, now: number): boolean {
  return tokens.expiresAt - REFRESH_SKEW_MS <= now;
}
