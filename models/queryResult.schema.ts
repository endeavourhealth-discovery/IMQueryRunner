import { JobStatus } from "~~/enums";

import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

export const queryResultSchema = z.object({
  id: z.number().int().optional(),
  queryIri: z.string(),
  queryResultSetId: z.number().int(),
  indicatorResultId: z.number().int(),
  searchDate: z.date().optional(),
  achievementDate: z.date().optional(),
  /** Not set until the query starts running */
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  version: z.number().int(),
  queryType: z.enum(IMQType),
  status: z.enum(JobStatus)
});
export type QueryResult = z.infer<typeof queryResultSchema>;
