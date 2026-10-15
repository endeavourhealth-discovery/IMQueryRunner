import { clearTokenCache, decodeJwtClaims, parseBearerToken, principalFromClaims, requireAuth } from "~~/server/utils/auth";

import { beforeEach, describe, expect, it, vi } from "vitest";

const casdoor = vi.hoisted(() => ({ introspectAccessToken: vi.fn() }));
vi.mock("~~/server/utils/casdoor", () => casdoor);

const session = vi.hoisted(() => ({ requireUserSession: vi.fn() }));
vi.hoisted(() => {
  vi.stubGlobal("requireUserSession", (...args: unknown[]) => (globalThis as any).__session(...args));
  vi.stubGlobal("getRequestHeader", (event: any, name: string) => event.headers[name]);
  vi.stubGlobal("createError", (opts: { statusCode: number; message: string }) => Object.assign(new Error(opts.message), { statusCode: opts.statusCode }));
});
(globalThis as any).__session = session.requireUserSession;

function jwt(claims: object): string {
  return `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
}

const userToken = jwt({ owner: "org", name: "jbloggs", id: "u1", type: "normal-user" });
const appToken = jwt({ owner: "admin", name: "reporting", id: "some-uuid", type: "application" });

const eventWith = (authorization?: string) => ({ headers: { authorization }, context: {} }) as any;

describe("parseBearerToken", () => {
  it.each([
    ["Bearer abc.def", "abc.def"],
    ["bearer abc", "abc"]
  ])("reads %s", (header, token) => expect(parseBearerToken(header)).toBe(token));

  it.each([undefined, "", "Basic Zm9vOmJhcg==", "Bearer", "Bearer a b"])("ignores %s", header => expect(parseBearerToken(header)).toBeUndefined());
});

describe("decodeJwtClaims", () => {
  it("reads the payload", () => expect(decodeJwtClaims(userToken)).toMatchObject({ owner: "org", name: "jbloggs" }));
  it("returns nothing for a token that is not a JWT", () => {
    expect(decodeJwtClaims("opaque")).toEqual({});
    expect(decodeJwtClaims("a.!!!.c")).toEqual({});
  });
});

describe("principalFromClaims", () => {
  it("takes a person's id from the token", () => {
    expect(principalFromClaims(decodeJwtClaims(userToken), userToken)).toEqual({
      user: { id: "u1", owner: "org", name: "jbloggs" },
      machine: false,
      bearerToken: userToken
    });
  });

  it("identifies an application by owner/name", () => {
    const principal = principalFromClaims(decodeJwtClaims(appToken), appToken);
    expect(principal).toMatchObject({ machine: true, user: { id: "admin/reporting" } });
  });

  it("rejects claims with no identity", () => {
    expect(principalFromClaims({ name: "x" }, "t")).toBeUndefined();
    expect(principalFromClaims({ owner: "o", name: "x" }, "t")).toBeUndefined();
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    clearTokenCache();
    casdoor.introspectAccessToken.mockReset().mockResolvedValue({ active: true });
    session.requireUserSession.mockReset().mockResolvedValue({ user: { id: "u9", owner: "org", name: "cookieuser" } });
  });

  it("falls back to the session cookie when there is no bearer token", async () => {
    const principal = await requireAuth(eventWith());
    expect(principal).toEqual({ user: { id: "u9", owner: "org", name: "cookieuser" }, machine: false });
    expect(casdoor.introspectAccessToken).not.toHaveBeenCalled();
  });

  it("accepts a valid machine token", async () => {
    const principal = await requireAuth(eventWith(`Bearer ${appToken}`));
    expect(principal).toMatchObject({ machine: true, bearerToken: appToken, user: { id: "admin/reporting" } });
    expect(session.requireUserSession).not.toHaveBeenCalled();
  });

  it("rejects an inactive token without trying the cookie", async () => {
    casdoor.introspectAccessToken.mockResolvedValue({ active: false });
    await expect(requireAuth(eventWith(`Bearer ${userToken}`))).rejects.toMatchObject({ statusCode: 401 });
    expect(session.requireUserSession).not.toHaveBeenCalled();
  });

  it("rejects an active token that does not identify anyone", async () => {
    await expect(requireAuth(eventWith("Bearer opaque-token"))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("reports 502 when Casdoor cannot be reached", async () => {
    casdoor.introspectAccessToken.mockRejectedValue(new Error("down"));
    await expect(requireAuth(eventWith(`Bearer ${userToken}`))).rejects.toMatchObject({ statusCode: 502 });
  });

  it("introspects a token once within the cache window", async () => {
    await requireAuth(eventWith(`Bearer ${appToken}`));
    await requireAuth(eventWith(`Bearer ${appToken}`));
    expect(casdoor.introspectAccessToken).toHaveBeenCalledTimes(1);
  });

  it("does not trust a cached token past its own expiry", async () => {
    casdoor.introspectAccessToken.mockResolvedValue({ active: true, exp: Math.floor(Date.now() / 1000) - 1 });
    await requireAuth(eventWith(`Bearer ${appToken}`));
    await requireAuth(eventWith(`Bearer ${appToken}`));
    expect(casdoor.introspectAccessToken).toHaveBeenCalledTimes(2);
  });

  it("validates once per request", async () => {
    const event = eventWith(`Bearer ${appToken}`);
    await requireAuth(event);
    clearTokenCache();
    await requireAuth(event);
    expect(casdoor.introspectAccessToken).toHaveBeenCalledTimes(1);
  });
});
