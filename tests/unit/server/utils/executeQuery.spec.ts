import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeQuery } from "../../../../server/utils/executeQuery";
import { mysqlDb } from "../../../../server/db/mysql";
import { postgresDb } from "../../../../server/db/postgres";
import { imapi } from "../../../../server/utils/imapi";

(global as any).createError = vi.fn((msg) => new Error(msg));

const mockResultSetHeader = {
  affectedRows: 0,
  fieldCount: 0,
  info: "",
  insertId: 0,
  serverStatus: 0,
  warningStatus: 0,
  changedRows: 0,
};

vi.mock("../../../../server/db/mysql", () => ({
  mysqlDb: {
    execute: vi.fn(),
  },
}));

vi.mock("../../../../server/db/postgres", () => ({
  postgresDb: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../../../../server/utils/imapi", () => ({
  imapi: {
    getQuerySql: vi.fn(),
    describeQuery: vi.fn(),
    getQueryRequestForSQL: vi.fn(),
    getSubqueryIris: vi.fn(),
  },
}));

describe.sequential("executeQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached results if they exist in memory", async () => {
    const queryRequest = {
      query: { iri: "query-1" },
      argument: [],
    } as any;

    const id = "job-id";

    // First call to populate cache
    vi.mocked(imapi.getQuerySql).mockResolvedValue("SELECT * FROM table");
    vi.mocked(imapi.getQueryRequestForSQL).mockResolvedValue({
      query: { iri: "http://endhealth.info/im#testQuery" },
    });
    vi.mocked(imapi.getSubqueryIris).mockResolvedValue([]);
    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[], []] as any) // getCachedQueryResults -> tableExists
      .mockResolvedValueOnce([[{ id: "patient-1" }], []] as any) // main query
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // storeQueryResultsAndCache -> createTable
      .mockResolvedValueOnce([mockResultSetHeader, []] as any); // storeQueryResultsAndCache -> insert

    await executeQuery("SELECT * FROM table", queryRequest, id);

    // Second call should hit memory cache
    vi.mocked(mysqlDb.execute).mockClear();
    const result = await executeQuery("SELECT * FROM table", queryRequest, id);

    expect(result).toEqual(["patient-1"]);
    expect(mysqlDb.execute).not.toHaveBeenCalled();
  });

  it("should fetch from database cache if not in memory but table exists", async () => {
    const queryRequest = {
      query: { iri: "query-2" },
      argument: [],
    } as any;

    const id = "job-id";

    // Mock tableExists to return true
    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[{ TABLE_NAME: "some-hash" }], []] as any) // tableExists
      .mockResolvedValueOnce([[{ id: "patient-cache-1" }], []] as any); // cache query

    const result = await executeQuery("SELECT * FROM table", queryRequest, id);

    expect(result).toEqual(["patient-cache-1"]);
    expect(mysqlDb.execute).toHaveBeenCalledTimes(2);
  });

  it("should execute full query when no cache exists", async () => {
    const queryRequest = {
      query: { iri: "query-3" },
      argument: [],
    } as any;

    const id = "job-id";

    vi.mocked(imapi.getQuerySql).mockResolvedValue("SELECT * FROM table");

    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[], []] as any) // getCachedQueryResults -> tableExists
      .mockResolvedValueOnce([[{ id: "patient-new" }], []] as any) // main query
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // storeQueryResultsAndCache -> createTable
      .mockResolvedValueOnce([mockResultSetHeader, []] as any); // storeQueryResultsAndCache -> insert

    const result = await executeQuery("SELECT * FROM table", queryRequest, id);

    expect(result).toEqual(["patient-new"]);
    expect(postgresDb.update).toHaveBeenCalled();
  });

  it("should resolve arguments and replace them in SQL", async () => {
    const queryRequest = {
      query: { iri: "query-4" },
      argument: [
        { parameter: "$param1", valueData: "value1" },
        { parameter: "$param2", valueIri: { iri: "iri2" } },
      ],
    } as any;

    const id = "job-id";

    vi.mocked(imapi.getQuerySql).mockResolvedValue(
      "SELECT * FROM table WHERE col1 = $param1 AND col2 = $param2",
    );
    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[], []] as any) // getCachedQueryResults -> tableExists
      .mockResolvedValueOnce([[{ id: "patient-1" }], []] as any) // main query
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // createTable
      .mockResolvedValueOnce([mockResultSetHeader, []] as any); // insert cache

    await executeQuery("SELECT * FROM table", queryRequest, id);

    expect(mysqlDb.execute).toHaveBeenCalledWith(
      "SELECT * FROM table WHERE col1 = 'value1' AND col2 = 'iri2'",
    );
  });

  it("should handle sub-queries and replace their IRIs with hash codes", async () => {
    const queryRequest = {
      query: {
        iri: "query-5",
        and: [{ isCohort: { iri: "sub-query-1" } }],
      },
      argument: [],
    } as any;

    const id = "job-id";

    vi.mocked(imapi.describeQuery).mockResolvedValue({ iri: "sub-query-1" });
    vi.mocked(imapi.getQuerySql).mockImplementation(async (req: any) => {
      if (req.query.iri === "query-5")
        return "SELECT * FROM table WHERE member_of = q_sub-query-1";
      if (req.query.iri === "sub-query-1") return "SELECT id FROM sub_table";
      return "";
    });

    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[], []] as any) // getCachedQueryResults(main) -> tableExists
      .mockResolvedValueOnce([[], []] as any) // runSubQueries(main) -> tableExists(sub-query-1)
      .mockResolvedValueOnce([[{ id: "sub-p1" }], []] as any) // runSubQueries(main) -> mysqlDb.execute(sub-query sql)
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // storeQueryResultsAndCache(sub) -> createTable
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // storeQueryResultsAndCache(sub) -> insert cache
      .mockResolvedValueOnce([[{ id: "main-p1" }], []] as any) // mysqlDb.execute(resolved main sql)
      .mockResolvedValueOnce([mockResultSetHeader, []] as any) // storeQueryResultsAndCache(main) -> createTable
      .mockResolvedValueOnce([mockResultSetHeader, []] as any); // storeQueryResultsAndCache(main) -> insert cache

    const result = await executeQuery("main-sql", queryRequest, id);

    expect(result).toEqual(["main-p1"]);
    expect(mysqlDb.execute).toHaveBeenCalledWith(
      expect.stringMatching(
        /SELECT \* FROM table WHERE member_of = "[a-f0-9]+"/,
      ),
    );
  });

  it("should throw error if iri is invalid", async () => {
    const queryRequest = {
      query: { iri: "query-6" },
      argument: [
        { parameter: "$param1", valueIriList: [{ iri: "invalid-iri" }] },
      ],
    } as any;

    vi.mocked(imapi.getQuerySql).mockResolvedValue(
      "SELECT * FROM table WHERE col = $param1",
    );
    vi.mocked(mysqlDb.execute).mockResolvedValue([[], []] as any); // tableExists

    await expect(executeQuery("sql", queryRequest, "id")).rejects.toThrow(
      "Invalid iri",
    );
  });

  it("should apply pagination to cache query", async () => {
    const queryRequest = {
      query: { iri: "query-7" },
      page: { pageNumber: 2, pageSize: 10 },
    } as any;

    vi.mocked(mysqlDb.execute)
      .mockResolvedValueOnce([[{ TABLE_NAME: "some-hash" }], []] as any) // tableExists
      .mockResolvedValueOnce([[{ id: "p1" }], []] as any); // cache query

    await executeQuery("sql", queryRequest, "id");

    expect(mysqlDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT 10 OFFSET 10"),
    );
  });
});
