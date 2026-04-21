import { z } from "zod";

export const indicatorResultSchema = z.object({
  id: z.number().int().optional(),
  queryIri: z.string(),
  queryResultSetId: z.number().int(),
  searchDate: z.date().optional(),
  achievementDate: z.date().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  version: z.number().int(),
});
export type IndicatorResult = z.infer<typeof indicatorResultSchema>;
