import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("auth/oidc route", () => {
  const createdHandlers: ReturnType<typeof vi.fn>[] = [];
  // The real handler writes its cookies via res.setHeader, then redirects (ending the response)
  type Res = { setHeader: (name: string, value: unknown) => void; getHeader: (name: string) => unknown; writeHead: () => void };
  const defineOAuthOidcEventHandler = vi.fn(() => {
    const handler = vi.fn((event: { node: { res: Res } }) => {
      const res = event.node?.res;
      if (!res) return "handled";
      // h3 adds cookies one at a time, and the response is then flushed by the redirect
      res.setHeader("set-cookie", "nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax");
      res.setHeader("set-cookie", [res.getHeader("set-cookie"), "nuxt-auth-pkce=def; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax"].flat());
      res.setHeader("set-cookie", [res.getHeader("set-cookie"), "other=1; Path=/; HttpOnly"].flat());
      res.writeHead();
      return "handled";
    });
    createdHandlers.push(handler);
    return handler;
  });

  let secureCookie: boolean;
  let written: unknown;
  const makeEvent = () => {
    const headers = new Map<string, unknown>();
    const res: Res = {
      setHeader: (name, value) => void headers.set(name, value),
      getHeader: name => headers.get(name),
      // Records what is actually sent
      writeHead: () => {
        written = headers.get("set-cookie");
      }
    };
    return { node: { res } };
  };

  beforeEach(() => {
    vi.resetModules();
    createdHandlers.length = 0;
    defineOAuthOidcEventHandler.mockClear();
    secureCookie = true;
    written = undefined;
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
  it("strips Secure from every cookie sent when secure cookies are switched off", async () => {
    secureCookie = false;
    const route = await loadRoute();

    route(makeEvent());

    expect(written).toEqual([
      "nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; SameSite=Lax",
      "nuxt-auth-pkce=def; Max-Age=600; Path=/; HttpOnly; SameSite=Lax",
      "other=1; Path=/; HttpOnly"
    ]);
  });

  it("leaves the cookies alone by default", async () => {
    const route = await loadRoute();

    route(makeEvent());

    expect(written).toEqual([
      "nuxt-auth-state=abc; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax",
      "nuxt-auth-pkce=def; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax",
      "other=1; Path=/; HttpOnly"
    ]);
  });

  it("does not create any handler at import time", async () => {
    await import("~/server/routes/auth/oidc.get");
    expect(defineOAuthOidcEventHandler).not.toHaveBeenCalled();
  });
});
