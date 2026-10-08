import { streamRows } from "~~/server/db/mysql";

import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const conn = vi.hoisted(() => ({
  release: vi.fn(),
  destroy: vi.fn(),
  connection: { query: vi.fn() }
}));

vi.mock("mysql2/promise", () => ({
  default: { createPool: () => ({ getConnection: async () => ({ release: conn.release, destroy: conn.destroy, connection: conn.connection }) }) }
}));
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: () => ({}) }));

function rows(...items: object[]) {
  return Readable.from(items, { objectMode: true });
}

describe("streamRows", () => {
  beforeEach(() => {
    conn.release.mockReset();
    conn.destroy.mockReset();
    conn.connection.query.mockReset();
  });

  it("yields every row and returns the connection to the pool", async () => {
    conn.connection.query.mockReturnValue({ stream: () => rows({ id: 1 }, { id: 2 }, { id: 3 }) });

    const seen: unknown[] = [];
    for await (const row of streamRows("SELECT id FROM t WHERE x = ?", [7])) seen.push(row);

    expect(seen).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(conn.connection.query).toHaveBeenCalledWith("SELECT id FROM t WHERE x = ?", [7]);
    expect(conn.release).toHaveBeenCalledOnce();
    expect(conn.destroy).not.toHaveBeenCalled();
  });

  it("discards the connection, not releases it, when the consumer stops early", async () => {
    conn.connection.query.mockReturnValue({ stream: () => rows({ id: 1 }, { id: 2 }, { id: 3 }) });

    for await (const row of streamRows("SELECT 1")) {
      expect(row).toEqual({ id: 1 });
      break; // the server may still be sending rows on this connection, so it must not go back to the pool
    }

    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(conn.release).not.toHaveBeenCalled();
  });

  it("discards the connection and passes the error on when the query fails part-way", async () => {
    const failing = new Readable({
      objectMode: true,
      read() {
        this.push({ id: 1 });
        this.destroy(new Error("connection lost"));
      }
    });
    conn.connection.query.mockReturnValue({ stream: () => failing });

    await expect(
      (async () => {
        for await (const _row of streamRows("SELECT 1")) {
          /* drain */
        }
      })()
    ).rejects.toThrow("connection lost");

    expect(conn.destroy).toHaveBeenCalledOnce();
    expect(conn.release).not.toHaveBeenCalled();
  });
});
