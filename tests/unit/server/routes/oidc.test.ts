import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("auth/oidc route", () => {
  const createdHandlers: ReturnType<typeof vi.fn>[] = [];
  // The real handler writes its cookies via res.setHeader, then redirects (ending the response)
  const defineOAuthOidcEventHandler = vi.fn(() => {
    const handler = vi.fn((event: { node: { res: { setHeader: (name: string, value: string[]) => void } } }) => {
      event.node?.res.setHeader("set-cookie", ["nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax", "other=1; Path=/; HttpOnly"]);
      return "handled";
    });
    createdHandlers.push(handler);
    return handler;
  });

  let secureCookie: boolean;
  let written: unknown[];
  const makeEvent = () => ({ node: { res: { setHeader: vi.fn((_name: string, value: unknown) => written.push(value)) } } });

  beforeEach(() => {
    vi.resetModules();
    createdHandlers.length = 0;
    defineOAuthOidcEventHandler.mockClear();
    secureCookie = true;
    written = [];
    // Nitro auto-imports these in the real app
    vi.stubGlobal("eventHandler", (handler: unknown) => handler);
    vi.stubGlobal("defineOAuthOidcEventHandler", defineOAuthOidcEventHandler);
    vi.stubGlobal("useRuntimeConfig", () => ({ session: { cookie: { secure: secureCookie } } }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const loadRoute = async () => (await import("~/server/routes/auth/oidc.get")).default as unknown as (event: unknown) => unknown;

  // nuxt-auth-utils merges its config into itself on every request and the merge concatenates arrays, so one long-lived handler makes the
  // requested OAuth scope grow with every login until Casdoor cannot store it ("Data too long for column 'scope'").
  it("builds a fresh OIDC handler for every request so its config cannot accumulate", async () => {
    const route = await loadRoute();
    const first = makeEvent();
    const second = makeEvent();

    expect(route(first)).toBe("handled");
    expect(route(second)).toBe("handled");

    expect(defineOAuthOidcEventHandler).toHaveBeenCalledTimes(2);
    expect(createdHandlers[0]).toHaveBeenCalledWith(first);
    expect(createdHandlers[1]).toHaveBeenCalledWith(second);
    expect(createdHandlers[0]).not.toBe(createdHandlers[1]);
  });

  // Browsers drop Secure cookies on a plain-http origin, so the OIDC state cookie never comes back ("state mismatch").
  it("strips Secure from cookies as they are written when secure cookies are switched off", async () => {
    secureCookie = false;
    const route = await loadRoute();

    route(makeEvent());

    expect(written).toEqual([["nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; SameSite=Lax", "other=1; Path=/; HttpOnly"]]);
  });

  it("leaves the cookies alone by default", async () => {
    const route = await loadRoute();

    route(makeEvent());

    expect(written).toEqual([["nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax", "other=1; Path=/; HttpOnly"]]);
  });

  it("does not create any handler at import time", async () => {
    await import("~/server/routes/auth/oidc.get");
    expect(defineOAuthOidcEventHandler).not.toHaveBeenCalled();
  });
});
