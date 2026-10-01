import { getJobById, getQueryResultSetRows, getQueryResultsPaged } from "~~/server/helpers/mysqlHelper";
import { getDebugPatientId } from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.number(),
  queryType: z.enum(IMQType),
  queryIri: z.url()
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25)
});

export default defineEventHandler(async event => {
  const { jobId, queryIri, queryType } = await getValidatedRouterParams(event, paramSchema.parse);
  const { page, size } = await getValidatedQuery(event, querySchema.parse);
  const decodedQueryIri = decodeURIComponent(queryIri);
  // TODO: Refactor to use a single query with joins instead of multiple queries

  const job = await getJobById(jobId);

  const queryResultSetRows = await getQueryResultSetRows(job);
  const queryResultSet = queryResultSetRows[0];

  const debugPatientId = job?.queryRequests?.map(getDebugPatientId).find(Boolean);

  return await getQueryResultsPaged(decodedQueryIri, queryResultSet.id, queryType, page, size, debugPatientId);
});
