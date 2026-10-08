import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("auth/oidc route", () => {
  const createdHandlers: ReturnType<typeof vi.fn>[] = [];
  const defineOAuthOidcEventHandler = vi.fn(() => {
    const handler = vi.fn(() => "handled");
    createdHandlers.push(handler);
    return handler;
  });

  beforeEach(() => {
    vi.resetModules();
    createdHandlers.length = 0;
    defineOAuthOidcEventHandler.mockClear();
    // Nitro auto-imports these in the real app
    vi.stubGlobal("eventHandler", (handler: unknown) => handler);
    vi.stubGlobal("defineOAuthOidcEventHandler", defineOAuthOidcEventHandler);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // nuxt-auth-utils merges its config into itself on every request and the merge concatenates arrays, so one long-lived handler makes the
  // requested OAuth scope grow with every login until Casdoor cannot store it ("Data too long for column 'scope'").
  it("builds a fresh OIDC handler for every request so its config cannot accumulate", async () => {
    const route = (await import("~/server/routes/auth/oidc.get")).default as unknown as (event: unknown) => unknown;
    const first = {};
    const second = {};

    expect(route(first)).toBe("handled");
    expect(route(second)).toBe("handled");

    expect(defineOAuthOidcEventHandler).toHaveBeenCalledTimes(2);
    expect(createdHandlers[0]).toHaveBeenCalledWith(first);
    expect(createdHandlers[1]).toHaveBeenCalledWith(second);
    expect(createdHandlers[0]).not.toBe(createdHandlers[1]);
  });

  it("does not create any handler at import time", async () => {
    await import("~/server/routes/auth/oidc.get");
    expect(defineOAuthOidcEventHandler).not.toHaveBeenCalled();
  });
});
