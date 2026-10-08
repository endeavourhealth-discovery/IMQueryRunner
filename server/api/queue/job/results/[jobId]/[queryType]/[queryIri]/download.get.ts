import Logger from "#shared/logger";
import { ErrorCode, JobStatus } from "~~/enums";
import { streamRows } from "~~/server/db/mysql";
import { getJobForUser, getQueryResultIdForJob } from "~~/server/helpers/mysqlHelper";
import { csvChunks } from "~~/server/utils/csv";
import { getDebugPatientId } from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { Readable } from "node:stream";
import { z } from "zod";

const LOG = Logger("api/queue/job/results/download");

const paramSchema = z.object({
  jobId: z.coerce.number(),
  queryType: z.enum(IMQType),
  queryIri: z.string()
});

// Each download holds a database connection until the browser has taken the last byte, and the pool has only 10
const MAX_CONCURRENT_DOWNLOADS = 3;
let activeDownloads = 0;

const COHORT_COLUMNS = ["entity_id", "entity_org_id"];
const DATASET_COLUMNS = ["entity_id", "column_group", "json", "entity_org_id"];
const DEBUG_COLUMNS = ["query_iri", "patient_id", "step_no", "cte_name", "patient_found"];

/** Streams a result as CSV, without loading it into memory. */
export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId, queryIri, queryType } = await getValidatedRouterParams(event, paramSchema.parse);
  const decodedQueryIri = decodeURIComponent(queryIri);

  const job = await getJobForUser(jobId, user.id);

  let columns: string[];
  let rows: AsyncGenerator<Record<string, unknown>>;

  const debugPatientId = job.queryRequests?.map(getDebugPatientId).find(Boolean);
  if (debugPatientId) {
    columns = DEBUG_COLUMNS;
    rows = streamRows(`SELECT ${DEBUG_COLUMNS.join(", ")} FROM dataset.patient_exists WHERE query_iri = ? AND patient_id = ?`, [
      decodedQueryIri,
      debugPatientId
    ]);
  } else {
    if (queryType === IMQType.INDICATOR) {
      throw createError({ statusCode: 400, statusText: ErrorCode.InvalidRequestError, message: "Indicator results cannot be downloaded" });
    }
    if (job.status !== JobStatus.COMPLETED) {
      throw createError({ statusCode: 409, statusText: ErrorCode.InvalidRequestError, message: "Job has not completed" });
    }
    const queryResultId = await getQueryResultIdForJob(job.id, decodedQueryIri);
    if (queryResultId === undefined) {
      throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
    }

    if (queryType === IMQType.COHORT) {
      columns = COHORT_COLUMNS;
      rows = streamRows(`SELECT ${COHORT_COLUMNS.join(", ")} FROM dataset.cohort_results WHERE query_result_id = ?`, [queryResultId]);
    } else {
      columns = DATASET_COLUMNS;
      // json is not a reserved word, but quote it anyway
      rows = streamRows(`SELECT entity_id, column_group, \`json\`, entity_org_id FROM dataset.dataset_results WHERE query_result_id = ?`, [queryResultId]);
    }
  }

  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    throw createError({ statusCode: 429, statusText: ErrorCode.InvalidRequestError, message: "Too many downloads in progress, please try again shortly" });
  }
  activeDownloads++;

  const csv = Readable.from(csvChunks(columns, rows));
  csv.once("close", () => activeDownloads--);
  // h3 pipes the stream into the response and does not stop it when the browser goes away, which would leave the query running
  event.node.res.once("close", () => csv.destroy());
  csv.once("error", err => LOG.error({ err, jobId }, "Download failed"));

  // The last part of the iri, reduced to characters that are safe in a header
  const iriName =
    decodedQueryIri
      .split(/[/#]/)
      .pop()
      ?.replace(/[^A-Za-z0-9_-]/g, "_") || "results";
  const fileName = `job-${job.id}-${iriName}.csv`;
  setResponseHeaders(event, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store"
  });
  return sendStream(event, csv);
});
