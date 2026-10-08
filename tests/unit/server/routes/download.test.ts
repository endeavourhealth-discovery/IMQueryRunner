import handler from "~~/server/api/queue/job/results/[jobId]/[queryType]/[queryIri]/download.get";

import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ streamRows: vi.fn() }));
const helper = vi.hoisted(() => ({ getJobForUser: vi.fn(), getQueryResultIdForJob: vi.fn() }));
const headers = vi.hoisted(() => {
  const set: Record<string, string> = {};
  (globalThis as any).__headers = set;
  return { set };
});

vi.mock("~~/server/db/mysql", () => db);
vi.mock("~~/server/helpers/mysqlHelper", () => helper);
vi.mock("~~/server/utils/executeQuery", () => ({
  getDebugPatientId: (queryRequest: any) => queryRequest.argument?.find((a: any) => a.parameter === "$debugPatientId")?.valueData
}));

// Stand-ins for the Nitro/h3 functions the handler gets as auto-imports. Hoisted because the handler calls
// defineEventHandler as soon as it is imported.
vi.hoisted(() => {
  vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
  vi.stubGlobal("requireUserSession", async () => ({ user: { id: "u1" } }));
  vi.stubGlobal("getValidatedRouterParams", async (event: any, parse: (v: unknown) => unknown) => parse(event.params));
  vi.stubGlobal("createError", (opts: { statusCode: number; message: string }) => Object.assign(new Error(opts.message), { statusCode: opts.statusCode }));
  vi.stubGlobal("setResponseHeaders", (_event: unknown, values: Record<string, string>) => Object.assign((globalThis as any).__headers, values));
  // Hands the stream back untouched so each test decides whether to read it
  vi.stubGlobal("sendStream", async (_event: unknown, stream: unknown) => stream);
});

const IRI = "http://endhealth.info/im#Q_Example";
const run = handler as unknown as (event: any) => Promise<Readable>;

function eventFor(queryType = "COHORT", queryIri = encodeURIComponent(IRI)) {
  return { params: { jobId: "7", queryType, queryIri }, node: { res: new EventEmitter() } };
}

async function read(stream: Readable): Promise<string> {
  let text = "";
  for await (const chunk of stream) text += chunk;
  return text;
}

async function* rowsOf(items: object[], onClose?: () => void) {
  try {
    for (const item of items) yield item;
  } finally {
    onClose?.();
  }
}

const completedJob = { id: 7, status: "COMPLETED", queryRequests: [{ argument: [] }] };

describe("results download", () => {
  beforeEach(() => {
    db.streamRows.mockReset().mockImplementation(() => rowsOf([]));
    helper.getJobForUser.mockReset().mockResolvedValue(completedJob);
    helper.getQueryResultIdForJob.mockReset().mockResolvedValue(55);
    for (const key of Object.keys(headers.set)) delete headers.set[key];
  });

  it("streams a cohort as CSV with download headers", async () => {
    db.streamRows.mockImplementation(() =>
      rowsOf([
        { entity_id: 1, entity_org_id: 10 },
        { entity_id: 2, entity_org_id: 20 }
      ])
    );

    const stream = await run(eventFor());

    expect(await read(stream)).toBe('"entity_id","entity_org_id"\r\n"1","10"\r\n"2","20"\r\n');
    expect(headers.set["Content-Type"]).toBe("text/csv; charset=utf-8");
    expect(headers.set["Content-Disposition"]).toBe('attachment; filename="job-7-Q_Example.csv"');
    expect(headers.set["Cache-Control"]).toBe("no-store");
    expect(db.streamRows).toHaveBeenCalledWith(expect.stringContaining("FROM dataset.cohort_results WHERE query_result_id = ?"), [55]);
  });

  it("streams a dataset, writing its JSON column as JSON", async () => {
    db.streamRows.mockImplementation(() => rowsOf([{ entity_id: 1, column_group: "g", json: { a: 1 }, entity_org_id: 2 }]));

    const csv = await read(await run(eventFor("DATASET")));

    expect(csv).toBe('"entity_id","column_group","json","entity_org_id"\r\n"1","g","{""a"":1}","2"\r\n');
    expect(db.streamRows).toHaveBeenCalledWith(expect.stringContaining("FROM dataset.dataset_results"), [55]);
  });

  it("downloads the debug rows, not the cohort, when the job was a debug run", async () => {
    helper.getJobForUser.mockResolvedValue({ ...completedJob, queryRequests: [{ argument: [{ parameter: "$debugPatientId", valueData: "123" }] }] });

    await read(await run(eventFor()));

    expect(db.streamRows).toHaveBeenCalledWith(expect.stringContaining("FROM dataset.patient_exists WHERE query_iri = ? AND patient_id = ?"), [IRI, "123"]);
    expect(helper.getQueryResultIdForJob).not.toHaveBeenCalled();
  });

  it("only ever asks for the signed-in user's job", async () => {
    await read(await run(eventFor()));
    expect(helper.getJobForUser).toHaveBeenCalledWith(7, "u1");
  });

  it("refuses indicators (400), unfinished jobs (409) and unknown results (404) before reading anything", async () => {
    await expect(run(eventFor("INDICATOR"))).rejects.toMatchObject({ statusCode: 400 });

    helper.getJobForUser.mockResolvedValue({ ...completedJob, status: "RUNNING" });
    await expect(run(eventFor())).rejects.toMatchObject({ statusCode: 409 });

    helper.getJobForUser.mockResolvedValue(completedJob);
    helper.getQueryResultIdForJob.mockResolvedValue(undefined);
    await expect(run(eventFor())).rejects.toMatchObject({ statusCode: 404 });

    expect(db.streamRows).not.toHaveBeenCalled();
  });

  it("limits how many downloads run at once, and frees a slot when one ends", async () => {
    const open = [];
    const events = [];
    for (let i = 0; i < 3; i++) {
      const event = eventFor();
      events.push(event);
      open.push(await run(event)); // started but not read
    }

    await expect(run(eventFor())).rejects.toMatchObject({ statusCode: 429 });

    events[0]!.node.res.emit("close"); // the browser of the first download went away
    await new Promise(resolve => setImmediate(resolve));
    const next = await run(eventFor());
    expect(next).toBeInstanceOf(Readable);

    for (const stream of [...open, next]) stream.destroy();
    await new Promise(resolve => setImmediate(resolve));
  });

  it("stops reading from the database when the browser disconnects", async () => {
    let closed = false;
    db.streamRows.mockImplementation(() =>
      rowsOf(
        Array.from({ length: 5000 }, (_, i) => ({ entity_id: i, entity_org_id: 1 })),
        () => (closed = true)
      )
    );

    const event = eventFor();
    const stream = await run(event);
    await new Promise<void>(resolve => stream.once("data", () => resolve())); // the download has begun

    event.node.res.emit("close");
    await new Promise(resolve => setImmediate(resolve));

    expect(stream.destroyed).toBe(true);
    expect(closed).toBe(true);
  });
});
