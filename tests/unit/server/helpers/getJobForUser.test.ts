import { getJobForUser } from "~~/server/helpers/mysqlHelper";

import { beforeEach, describe, expect, it, vi } from "vitest";

const rows = vi.hoisted(() => ({ value: [] as any[] }));
const where = vi.hoisted(() => vi.fn());

vi.mock("~~/server/db/mysql", () => ({
  mysqlDb: {
    select: () => ({
      from: () => ({
        where: (clause: unknown) => {
          where(clause);
          return Promise.resolve(rows.value);
        }
      })
    })
  }
}));
vi.mock("#server/utils/queueEvents.ts", () => ({ emitQueueUpdate: vi.fn() }));
vi.mock("~~/server/services/EntityService", () => ({ default: {} }));
vi.mock("~~/server/services/QueryService", () => ({ default: {} }));
vi.mock("~~/server/utils/executeQuery", () => ({ resolveArgs: vi.fn(), sortQueryRequestsByDependency: vi.fn() }));

// Nitro auto-imports createError; stub it so the helper can run outside Nitro
vi.stubGlobal("createError", (opts: { status?: number; statusCode?: number; message?: string }) =>
  Object.assign(new Error(opts.message), { statusCode: opts.statusCode ?? opts.status })
);

describe("getJobForUser", () => {
  beforeEach(() => {
    rows.value = [];
    where.mockClear();
  });

  it("returns the job when it belongs to the user", async () => {
    rows.value = [{ id: 7, userId: "u1" }];
    await expect(getJobForUser(7, "u1")).resolves.toMatchObject({ id: 7, userId: "u1" });
    expect(where).toHaveBeenCalledOnce();
  });

  it("reports a job owned by someone else as not found (404)", async () => {
    // The query filters on user id, so another user's job comes back as no rows
    rows.value = [];
    await expect(getJobForUser(7, "someone-else")).rejects.toMatchObject({ statusCode: 404, message: "Queue job not found" });
  });
});
