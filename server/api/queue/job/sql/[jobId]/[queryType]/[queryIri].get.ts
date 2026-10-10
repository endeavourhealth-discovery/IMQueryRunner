import { ErrorCode, JobStatus } from "~~/enums";
import { getExecutedSqlForJob, getJobForUser } from "~~/server/helpers/mysqlHelper";

import { IMQType } from "@endeavour/vue-library/enums";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number(),
  queryType: z.enum(IMQType),
  queryIri: z.string()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId, queryIri, queryType } = await getValidatedRouterParams(event, paramSchema.parse);
  const decodedQueryIri = decodeURIComponent(queryIri);

  // Also the ownership check: a job that is not the caller's is a 404
  const job = await getJobForUser(jobId, user.id);

  // TODO: return indicator sql from imapi?
  if (queryType === IMQType.INDICATOR) return { executedSQL: "" };

  if (job.status !== JobStatus.COMPLETED) {
    throw createError({ statusCode: 409, statusText: ErrorCode.InvalidRequestError, message: "Job has not completed" });
  }

  const executedSql = await getExecutedSqlForJob(job.id, decodedQueryIri);
  if (executedSql === undefined) {
    throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
  }

  return { executedSQL: executedSql };
});
