import { REFRESH_SKEW_MS, type StoredTokens, needsRefresh, toStoredTokens } from "~/server/utils/tokenLifetime";

import { describe, expect, it } from "vitest";

const NOW = 1_000_000;

describe("toStoredTokens", () => {
  it("computes the expiry from expires_in", () => {
    expect(toStoredTokens({ access_token: "a", refresh_token: "r", expires_in: 60 }, NOW)).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: NOW + 60_000
    });
  });

  it("falls back to a short lifetime when Casdoor does not say", () => {
    expect(toStoredTokens({ access_token: "a" }, NOW).expiresAt).toBe(NOW + 300_000);
  });

  it("keeps the previous refresh token when none is issued", () => {
    const previous: StoredTokens = { accessToken: "old", refreshToken: "keep", expiresAt: 0 };
    expect(toStoredTokens({ access_token: "new", expires_in: 60 }, NOW, previous).refreshToken).toBe("keep");
  });

  it("prefers a newly issued refresh token", () => {
    const previous: StoredTokens = { accessToken: "old", refreshToken: "old-refresh", expiresAt: 0 };
    expect(toStoredTokens({ access_token: "new", refresh_token: "new-refresh" }, NOW, previous).refreshToken).toBe("new-refresh");
  });
});

describe("needsRefresh", () => {
  const tokens = (expiresAt: number): StoredTokens => ({ accessToken: "a", expiresAt });

  it("is false while the token has comfortable time left", () => {
    expect(needsRefresh(tokens(NOW + REFRESH_SKEW_MS + 1), NOW)).toBe(false);
  });

  it("is true inside the safety margin before expiry", () => {
    expect(needsRefresh(tokens(NOW + REFRESH_SKEW_MS), NOW)).toBe(true);
    expect(needsRefresh(tokens(NOW + 1), NOW)).toBe(true);
  });

  it("is true once expired", () => {
    expect(needsRefresh(tokens(NOW - 1), NOW)).toBe(true);
  });
});
