import { type QueryRequest } from "@endeavour/vue-library/models";

import * as z from "zod";

export const jobQueueMessageSchema = z.object({
  jobId: z.number().int(),
  index: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  queryResultSetId: z.number().int(),
  indicatorResultId: z.number().int().nullable(),
  queryRequest: z.custom<QueryRequest>(value => typeof value === "object" && value !== null)
});

export type JobQueueMessage = z.infer<typeof jobQueueMessageSchema>;

export type PlannedQueryRequest = Pick<JobQueueMessage, "queryRequest" | "queryResultSetId" | "indicatorResultId">;
