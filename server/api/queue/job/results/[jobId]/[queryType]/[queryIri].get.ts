import { ErrorCode, JobStatus } from "~~/enums";
import { getDebugResultsPaged, getJobForUser, getQueryResultIdForJob, getQueryResultsPaged } from "~~/server/helpers/mysqlHelper";
import { getDebugPatientId } from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number(),
  queryType: z.enum(IMQType),
  queryIri: z.string()
});

// The results table offers page sizes up to 8 x 25, so 200 is the largest size the UI asks for
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(200).default(25)
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId, queryIri, queryType } = await getValidatedRouterParams(event, paramSchema.parse);
  const { page, size } = await getValidatedQuery(event, querySchema.parse);
  const decodedQueryIri = decodeURIComponent(queryIri);

  // Also the ownership check: a job that is not the caller's is a 404
  const job = await getJobForUser(jobId, user.id);

  const debugPatientId = job.queryRequests?.map(getDebugPatientId).find(Boolean);
  if (debugPatientId) return getDebugResultsPaged(decodedQueryIri, debugPatientId, page, size);

  // TODO: return indicator results - get sql from imapi
  if (queryType === IMQType.INDICATOR) return { result: [], totalCount: 0, page };

  if (job.status !== JobStatus.COMPLETED) {
    throw createError({ statusCode: 409, statusText: ErrorCode.InvalidRequestError, message: "Job has not completed" });
  }

  const queryResultId = await getQueryResultIdForJob(job.id, decodedQueryIri);
  if (queryResultId === undefined) {
    throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
  }

  return getQueryResultsPaged(queryResultId, queryType, page, size);
});
