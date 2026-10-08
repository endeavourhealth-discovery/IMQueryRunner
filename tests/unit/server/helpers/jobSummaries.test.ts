import { JobStatus } from "~~/enums";
import { getJobsResultSummaries } from "~~/server/helpers/jobSummaries";

import { IMQType } from "@endeavour/vue-library/enums";

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ responses: [] as any[][], selectCalls: 0 }));
const entityMock = vi.hoisted(() => ({ getEntitySummary: vi.fn() }));
const queryMock = vi.hoisted(() => ({ getSubqueryIris: vi.fn() }));

vi.mock("~~/server/db/mysql", () => {
  // Every select() takes the next queued response when it is started, so queue order must match call order
  const chain = (response: any[]) => {
    const c: any = new Proxy(
      {},
      {
        get: (_, prop) => (prop === "then" ? (res: any, rej: any) => Promise.resolve(response).then(res, rej) : () => c)
      }
    );
    return c;
  };
  return {
    mysqlDb: {
      select: () => {
        state.selectCalls++;
        return chain(state.responses.shift() ?? []);
      }
    }
  };
});
vi.mock("~~/server/services/EntityService", () => ({ default: entityMock }));
vi.mock("~~/server/services/QueryService", () => ({ default: queryMock }));

vi.stubGlobal("createError", (opts: { status?: number; statusCode?: number; message?: string }) =>
  Object.assign(new Error(opts.message), { statusCode: opts.statusCode ?? opts.status })
);

const IRI_A = "http://example.org/a";
const IRI_B = "http://example.org/b";

const job = (id: number, status = JobStatus.COMPLETED, iri = IRI_A) => ({ id, status, queryRequests: [{ query: { iri, queryType: IMQType.COHORT } }] }) as any;

// The lookup caches live for the whole process, so each test uses its own user to start cold
let userSeq = 0;
const newUser = () => `user-${++userSeq}`;

describe("getJobsResultSummaries", () => {
  beforeEach(() => {
    state.responses = [];
    state.selectCalls = 0;
    entityMock.getEntitySummary.mockReset().mockImplementation(async (_token: string, iri: string) => ({ name: `name of ${iri}` }));
    queryMock.getSubqueryIris.mockReset().mockResolvedValue([]);
  });

  it("uses a fixed number of database queries and one IMAPI lookup per distinct iri, however many jobs", async () => {
    const jobs = [job(1), job(2), job(3), job(4, JobStatus.RUNNING)];
    state.responses = [
      // result sets
      [
        { id: 10, jobId: 1 },
        { id: 20, jobId: 2 },
        { id: 30, jobId: 3 }
      ],
      // result rows (all the same query, so the same iri)
      [
        { id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT },
        { id: 200, queryResultSetId: 20, queryIri: IRI_A, queryType: IMQType.COHORT },
        { id: 300, queryResultSetId: 30, queryIri: IRI_A, queryType: IMQType.DATASET }
      ],
      // cohort counts, then dataset counts
      [
        { id: 100, total: 5 },
        { id: 200, total: 7 }
      ],
      [{ id: 300, total: 9 }]
    ];

    const results = await getJobsResultSummaries("token", newUser(), jobs);

    expect(state.selectCalls).toBe(4);
    expect(entityMock.getEntitySummary).toHaveBeenCalledTimes(1);
    expect(queryMock.getSubqueryIris).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.summaries.map(s => s.totalCount))).toEqual([[5], [7], [9], []]);
    expect(results[0]!.summaries[0]).toMatchObject({ queryName: `name of ${IRI_A}`, queryIri: IRI_A, queryType: IMQType.COHORT });
    expect(results.every(r => r.error === undefined)).toBe(true);
  });

  it("does not touch the database or IMAPI when no job is completed", async () => {
    const results = await getJobsResultSummaries("token", newUser(), [job(1, JobStatus.QUEUED), job(2, JobStatus.ERRORED)]);
    expect(state.selectCalls).toBe(0);
    expect(entityMock.getEntitySummary).not.toHaveBeenCalled();
    expect(results.map(r => r.summaries)).toEqual([[], []]);
  });

  it("reports a failing job without failing the others", async () => {
    // job 2 has a result set but no result rows; job 3 has no result sets at all; job 1 is fine
    state.responses = [
      [
        { id: 10, jobId: 1 },
        { id: 20, jobId: 2 }
      ],
      [{ id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT }],
      [{ id: 100, total: 3 }]
    ];

    const [one, two, three] = await getJobsResultSummaries("token", newUser(), [job(1), job(2), job(3)]);

    expect(one!.error).toBeUndefined();
    expect(one!.summaries).toHaveLength(1);
    expect(two!.error).toMatchObject({ statusCode: 404, message: "Query result not found" });
    expect(three!.error).toMatchObject({ statusCode: 400, message: "Query result set not found" });
  });

  it("includes sub query iris, excluding the query itself", async () => {
    queryMock.getSubqueryIris.mockResolvedValue([{ iri: IRI_B }, { iri: IRI_A }]);
    state.responses = [[{ id: 10, jobId: 1 }], [{ id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT }], [{ id: 100, total: 1 }]];
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1)]);
    expect(result!.summaries[0]!.subQueryIris).toEqual([IRI_B]);
  });

  it("does not share cached IMAPI answers between users", async () => {
    const respond = () => {
      state.responses = [[{ id: 10, jobId: 1 }], [{ id: 100, queryResultSetId: 10, queryIri: IRI_B, queryType: IMQType.COHORT }], [{ id: 100, total: 1 }]];
    };
    respond();
    await getJobsResultSummaries("token-1", newUser(), [job(1, JobStatus.COMPLETED, IRI_B)]);
    respond();
    await getJobsResultSummaries("token-2", newUser(), [job(1, JobStatus.COMPLETED, IRI_B)]);
    expect(entityMock.getEntitySummary).toHaveBeenCalledTimes(2);
  });
});
