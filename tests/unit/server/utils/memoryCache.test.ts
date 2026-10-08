import { TtlCache, createLimiter } from "~~/server/utils/memoryCache";

import { describe, expect, it, vi } from "vitest";

describe("TtlCache", () => {
  it("serves a value until it expires, then reloads", async () => {
    let now = 0;
    const cache = new TtlCache<string>(1000, 10, () => now);
    const load = vi.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("b");

    expect(await cache.getOrLoad("k", load)).toBe("a");
    now = 999;
    expect(await cache.getOrLoad("k", load)).toBe("a");
    now = 1000;
    expect(await cache.getOrLoad("k", load)).toBe("b");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("caches empty strings", async () => {
    const cache = new TtlCache<string>(1000, 10);
    const load = vi.fn().mockResolvedValue("");
    await cache.getOrLoad("k", load);
    await cache.getOrLoad("k", load);
    expect(load).toHaveBeenCalledOnce();
  });

  it("shares one load between concurrent callers", async () => {
    const cache = new TtlCache<number>(1000, 10);
    const load = vi.fn().mockResolvedValue(1);
    await Promise.all([cache.getOrLoad("k", load), cache.getOrLoad("k", load), cache.getOrLoad("k", load)]);
    expect(load).toHaveBeenCalledOnce();
  });

  it("does not cache a failed load", async () => {
    const cache = new TtlCache<number>(1000, 10);
    const load = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(2);
    await expect(cache.getOrLoad("k", load)).rejects.toThrow("boom");
    expect(await cache.getOrLoad("k", load)).toBe(2);
  });

  it("evicts the oldest entry when full", () => {
    const cache = new TtlCache<number>(1000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });
});

describe("createLimiter", () => {
  it("never runs more than the limit at once and runs everything", async () => {
    const limit = createLimiter(3);
    let active = 0;
    let peak = 0;
    let finished = 0;
    const task = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      finished++;
    };
    await Promise.all(Array.from({ length: 12 }, () => limit(task)));
    expect(peak).toBe(3);
    expect(finished).toBe(12);
  });

  it("keeps going after a task fails", async () => {
    const limit = createLimiter(1);
    await expect(limit(() => Promise.reject(new Error("x")))).rejects.toThrow("x");
    await expect(limit(async () => "ok")).resolves.toBe("ok");
  });
});
