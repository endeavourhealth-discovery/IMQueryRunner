import { getJobForUser, getQueryResultSQL, getQueryResultSetRows } from "~~/server/helpers/mysqlHelper";

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
  // TODO: Refactor to use a single query with joins instead of multiple queries

  const job = await getJobForUser(jobId, user.id);

  const queryResultSetRows = await getQueryResultSetRows(job);
  const queryResultSet = queryResultSetRows[0];

  const returnObject = {
    executedSQL: ""
  };

  if (queryType === IMQType.INDICATOR) {
    // TODO: return indicator sql from imapi?
    return returnObject;
  } else {
    const executedSql = await getQueryResultSQL(queryResultSet.id, decodedQueryIri);
    returnObject.executedSQL = executedSql;
  }

  return returnObject;
});
