import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("auth/oidc route", () => {
  const createdHandlers: ReturnType<typeof vi.fn>[] = [];
  const defineOAuthOidcEventHandler = vi.fn(() => {
    const handler = vi.fn(() => "handled");
    createdHandlers.push(handler);
    return handler;
  });

  let secureCookie: boolean;
  let setCookieHeader: string[] | undefined;
  const setResponseHeader = vi.fn((_event: unknown, _name: string, value: string[]) => {
    setCookieHeader = value;
  });

  beforeEach(() => {
    vi.resetModules();
    createdHandlers.length = 0;
    defineOAuthOidcEventHandler.mockClear();
    setResponseHeader.mockClear();
    secureCookie = true;
    setCookieHeader = undefined;
    // Nitro auto-imports these in the real app
    vi.stubGlobal("eventHandler", (handler: unknown) => handler);
    vi.stubGlobal("defineOAuthOidcEventHandler", defineOAuthOidcEventHandler);
    vi.stubGlobal("useRuntimeConfig", () => ({ session: { cookie: { secure: secureCookie } } }));
    vi.stubGlobal("getResponseHeader", () => setCookieHeader);
    vi.stubGlobal("setResponseHeader", setResponseHeader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // nuxt-auth-utils merges its config into itself on every request and the merge concatenates arrays, so one long-lived handler makes the
  // requested OAuth scope grow with every login until Casdoor cannot store it ("Data too long for column 'scope'").
  it("builds a fresh OIDC handler for every request so its config cannot accumulate", async () => {
    const route = (await import("~/server/routes/auth/oidc.get")).default as unknown as (event: unknown) => Promise<unknown>;
    const first = {};
    const second = {};

    expect(await route(first)).toBe("handled");
    expect(await route(second)).toBe("handled");

    expect(defineOAuthOidcEventHandler).toHaveBeenCalledTimes(2);
    expect(createdHandlers[0]).toHaveBeenCalledWith(first);
    expect(createdHandlers[1]).toHaveBeenCalledWith(second);
    expect(createdHandlers[0]).not.toBe(createdHandlers[1]);
  });

  // Browsers drop Secure cookies on a plain-http origin, so the OIDC state cookie never comes back ("state mismatch").
  it("strips Secure from the Set-Cookie headers when secure cookies are switched off", async () => {
    secureCookie = false;
    setCookieHeader = ["nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax", "other=1; Path=/; HttpOnly"];
    const route = (await import("~/server/routes/auth/oidc.get")).default as unknown as (event: unknown) => Promise<unknown>;

    await route({});

    expect(setCookieHeader).toEqual(["nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; SameSite=Lax", "other=1; Path=/; HttpOnly"]);
  });

  it("leaves the Set-Cookie headers alone by default", async () => {
    setCookieHeader = ["nuxt-auth-state=abc; Path=/; HttpOnly; Secure; SameSite=Lax"];
    const route = (await import("~/server/routes/auth/oidc.get")).default as unknown as (event: unknown) => Promise<unknown>;

    await route({});

    expect(setResponseHeader).not.toHaveBeenCalled();
  });

  it("does not create any handler at import time", async () => {
    await import("~/server/routes/auth/oidc.get");
    expect(defineOAuthOidcEventHandler).not.toHaveBeenCalled();
  });
});
