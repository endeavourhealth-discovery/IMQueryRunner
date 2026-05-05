import { z } from "zod";
import { JobStatus } from "~~/enums";

export const queryResultSetSchema = z.object({
  id: z.number().int().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  userId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  queryIri: z.string(),
  searchDate: z.string().optional(),
  achievementDate: z.string().optional(),
  jobId: z.number().int(),
});
export type QueryResultSet = z.infer<typeof queryResultSetSchema>;
