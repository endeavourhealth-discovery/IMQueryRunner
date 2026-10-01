import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

export const QueryResultSummarySchema = z.strictObject({
  totalCount: z.number(),
  queryName: z.string(),
  queryIri: z.url(),
  queryType: z.enum(IMQType)
});

export type QueryResultSummary = z.output<typeof QueryResultSummarySchema>;
