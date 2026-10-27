import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

export const QueryResultSummarySchema = z.strictObject({
  /** Not set for an indicator, which has an indicator result instead */
  queryResultId: z.number().optional(),
  /** On an indicator its own result id, on a sub query result the indicator it directly belongs to */
  indicatorResultId: z.number().optional(),
  /** null for an indicator: its results are its sub queries' */
  totalCount: z.number().nullable(),
  queryName: z.string(),
  queryIri: z.url(),
  queryType: z.enum(IMQType),
  startTime: z.date().nullable(),
  endTime: z.date().nullable(),
  subQueryIris: z.array(z.url()).optional(),
  /** Result ids of the sub queries this result used directly, as recorded when the job ran */
  subQueryResultIds: z.array(z.number()).optional()
});

export type QueryResultSummary = z.output<typeof QueryResultSummarySchema>;
