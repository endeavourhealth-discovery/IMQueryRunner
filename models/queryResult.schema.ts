import { z } from "zod";

export const queryResultSchema = z.object({
  id: z.number().int().optional(),
  queryIri: z.string(),
  queryResultSetId: z.number().int(),
  indicator: z.number().int(),
  searchDate: z.date().optional(),
  achievementDate: z.date().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  version: z.number().int(),
});
export type QueryResult = z.infer<typeof queryResultSchema>;
