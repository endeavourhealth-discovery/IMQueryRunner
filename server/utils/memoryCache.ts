/**
 * Small in-process TTL cache. Concurrent loads of the same key share one promise, and failed loads are never cached.
 * Per-process only: with several server instances each keeps its own copy, which is fine for short-lived lookups.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expires: number }>();
  private readonly loading = new Map<string, Promise<V>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expires <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V) {
    this.entries.delete(key);
    // Maps iterate in insertion order, so the first key is the oldest
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, { value, expires: this.now() + this.ttlMs });
  }

  async getOrLoad(key: string, load: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const inFlight = this.loading.get(key);
    if (inFlight) return inFlight;

    const promise = load()
      .then(value => {
        this.set(key, value);
        return value;
      })
      .finally(() => this.loading.delete(key));
    this.loading.set(key, promise);
    return promise;
  }

  clear() {
    this.entries.clear();
    this.loading.clear();
  }
}

/** Returns a function that runs tasks with at most `limit` in flight at once. */
export function createLimiter(limit: number) {
  let active = 0;
  const waiting: (() => void)[] = [];

  // A finished task hands its slot straight to the next waiter, so `active` never briefly dips below the true count
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= limit) await new Promise<void>(resolve => waiting.push(resolve));
    else active++;
    try {
      return await task();
    } finally {
      release();
    }
  };
}
