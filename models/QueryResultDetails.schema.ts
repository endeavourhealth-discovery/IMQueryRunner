import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

export const QueryResultDetailsSchema = z.strictObject({
  totalCount: z.number(),
  queryName: z.string(),
  queryIri: z.url(),
  queryType: z.enum(IMQType)
});

export type QueryResultDetails = z.output<typeof QueryResultDetailsSchema>;
