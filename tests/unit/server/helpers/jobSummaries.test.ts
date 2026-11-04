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
        { id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED },
        { id: 200, queryResultSetId: 20, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED },
        { id: 300, queryResultSetId: 30, queryIri: IRI_A, queryType: IMQType.DATASET, status: JobStatus.COMPLETED }
      ],
      // cohort counts, then dataset counts
      [
        { id: 100, total: 5 },
        { id: 200, total: 7 }
      ],
      [{ id: 300, total: 9 }],
      // sub query links, then indicator results
      [],
      []
    ];

    const results = await getJobsResultSummaries("token", newUser(), jobs);

    expect(state.selectCalls).toBe(6);
    expect(entityMock.getEntitySummary).toHaveBeenCalledTimes(1);
    expect(queryMock.getSubqueryIris).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.summaries.map(s => s.totalCount))).toEqual([[5], [7], [9], []]);
    expect(results[0]!.summaries[0]).toMatchObject({ queryName: `name of ${IRI_A}`, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED });
    expect(results.every(r => r.error === undefined)).toBe(true);
  });

  it("does not touch the database or IMAPI when every job is still queued", async () => {
    const results = await getJobsResultSummaries("token", newUser(), [job(1, JobStatus.QUEUED), job(2, JobStatus.QUEUED)]);
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
      [{ id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED }],
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
    state.responses = [
      [{ id: 10, jobId: 1 }],
      [{ id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED }],
      [{ id: 100, total: 1 }]
    ];
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1)]);
    expect(result!.summaries[0]!.subQueryIris).toEqual([IRI_B]);
  });

  it("includes the result ids of each result's direct sub queries", async () => {
    state.responses = [
      [{ id: 10, jobId: 1 }],
      [
        { id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED },
        { id: 101, queryResultSetId: 10, queryIri: IRI_B, queryType: IMQType.COHORT, status: JobStatus.COMPLETED }
      ],
      [
        { id: 100, total: 1 },
        { id: 101, total: 2 }
      ],
      [{ parentQueryResultId: 100, subQueryResultId: 101 }]
    ];
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1)]);
    expect(result!.summaries.map(s => [s.queryResultId, s.subQueryResultIds])).toEqual([
      [100, [101]],
      [101, undefined]
    ]);
  });

  it("adds an uncounted summary for each indicator and marks the sub query results linked to it", async () => {
    const IRI_IND = "http://example.org/indicator";
    state.responses = [
      [{ id: 10, jobId: 1 }],
      [
        { id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.COMPLETED, indicatorResultId: 5 },
        { id: 101, queryResultSetId: 10, queryIri: IRI_B, queryType: IMQType.COHORT, status: JobStatus.COMPLETED, indicatorResultId: null }
      ],
      [
        { id: 100, total: 1 },
        { id: 101, total: 2 }
      ],
      [{ parentQueryResultId: 100, subQueryResultId: 101 }],
      [{ id: 5, queryResultSetId: 10, queryIri: IRI_IND }]
    ];
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1, JobStatus.COMPLETED, IRI_IND)]);
    expect(result!.error).toBeUndefined();
    expect(result!.summaries).toEqual([
      expect.objectContaining({ indicatorResultId: 5, queryIri: IRI_IND, queryType: IMQType.INDICATOR, totalCount: null }),
      expect.objectContaining({ queryResultId: 100, indicatorResultId: 5, totalCount: 1, subQueryResultIds: [101] }),
      expect.not.objectContaining({ indicatorResultId: expect.anything() })
    ]);
    expect(result!.summaries[0]!.queryResultId).toBeUndefined();
  });

  it("gives each query of a job that stopped part way its status, counting only the completed ones", async () => {
    state.responses = [
      [{ id: 10, jobId: 1 }],
      [
        { id: 100, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status: JobStatus.ERRORED },
        { id: 101, queryResultSetId: 10, queryIri: IRI_B, queryType: IMQType.COHORT, status: JobStatus.COMPLETED },
        { id: 102, queryResultSetId: 10, queryIri: "http://example.org/c", queryType: IMQType.COHORT, status: JobStatus.CANCELLED }
      ],
      [{ id: 101, total: 2 }],
      [{ parentQueryResultId: 100, subQueryResultId: 101 }]
    ];
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1, JobStatus.ERRORED)]);
    expect(result!.error).toBeUndefined();
    expect(result!.summaries.map(s => [s.status, s.totalCount])).toEqual([
      [JobStatus.ERRORED, null],
      [JobStatus.COMPLETED, 2],
      [JobStatus.CANCELLED, null]
    ]);
    expect(result!.summaries[0]!.subQueryResultIds).toEqual([101]);
  });

  it("does not report a job that has not finished, or that failed, for having no results", async () => {
    state.responses = [[{ id: 10, jobId: 1 }]];
    const results = await getJobsResultSummaries("token", newUser(), [job(1, JobStatus.RUNNING), job(2, JobStatus.ERRORED)]);
    expect(results.map(r => [r.error, r.summaries])).toEqual([
      [undefined, []],
      [undefined, []]
    ]);
  });

  it.each([
    ["finished", { endTime: new Date() }, [], JobStatus.RUNNING, JobStatus.COMPLETED],
    ["a result errored", {}, [JobStatus.COMPLETED, JobStatus.ERRORED], JobStatus.ERRORED, JobStatus.ERRORED],
    ["a result is running", {}, [JobStatus.COMPLETED, JobStatus.RUNNING], JobStatus.RUNNING, JobStatus.RUNNING],
    ["between results", {}, [JobStatus.COMPLETED, JobStatus.QUEUED], JobStatus.RUNNING, JobStatus.RUNNING],
    ["not started", {}, [], JobStatus.RUNNING, JobStatus.QUEUED],
    ["never got to run", {}, [], JobStatus.ERRORED, JobStatus.CANCELLED]
  ])("works out an indicator's status when %s", async (_name, indicator, rowStatuses, jobStatus, expected) => {
    const IRI_IND = "http://example.org/indicator";
    state.responses = [
      [{ id: 10, jobId: 1 }],
      (rowStatuses as JobStatus[]).map((status, index) => ({ id: 100 + index, queryResultSetId: 10, queryIri: IRI_A, queryType: IMQType.COHORT, status })),
      [],
      [],
      [{ id: 5, queryResultSetId: 10, queryIri: IRI_IND, endTime: null, ...indicator }]
    ];
    if (!(rowStatuses as JobStatus[]).length) state.responses.splice(2, 2);
    const [result] = await getJobsResultSummaries("token", newUser(), [job(1, jobStatus as JobStatus, IRI_IND)]);
    expect(result!.summaries[0]).toMatchObject({ queryType: IMQType.INDICATOR, status: expected });
  });

  it("does not share cached IMAPI answers between users", async () => {
    const respond = () => {
      state.responses = [
        [{ id: 10, jobId: 1 }],
        [{ id: 100, queryResultSetId: 10, queryIri: IRI_B, queryType: IMQType.COHORT, status: JobStatus.COMPLETED }],
        [{ id: 100, total: 1 }]
      ];
    };
    respond();
    await getJobsResultSummaries("token-1", newUser(), [job(1, JobStatus.COMPLETED, IRI_B)]);
    respond();
    await getJobsResultSummaries("token-2", newUser(), [job(1, JobStatus.COMPLETED, IRI_B)]);
    expect(entityMock.getEntitySummary).toHaveBeenCalledTimes(2);
  });
});
