import { z } from "zod";

export const QueryResultDetailsSchema = z.strictObject({
  totalCount: z.number(),
  queryName: z.string()
});

export type QueryResultDetails = z.output<typeof QueryResultDetailsSchema>;
