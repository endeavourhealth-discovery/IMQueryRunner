import { z } from "zod";

export const queryResultSetSchema = z.object({
  id: z.number().int().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  queryIri: z.string(),
  searchDate: z.date().optional(),
  achievementDate: z.date().optional(),
  jobId: z.number().int()
});
export type QueryResultSet = z.infer<typeof queryResultSetSchema>;
