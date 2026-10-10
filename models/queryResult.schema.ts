import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

export const queryResultSchema = z.object({
  id: z.number().int().optional(),
  queryIri: z.string(),
  queryResultSetId: z.number().int(),
  indicatorResultId: z.number().int(),
  searchDate: z.date().optional(),
  achievementDate: z.date().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  version: z.number().int(),
  queryType: z.enum(IMQType)
});
export type QueryResult = z.infer<typeof queryResultSchema>;
