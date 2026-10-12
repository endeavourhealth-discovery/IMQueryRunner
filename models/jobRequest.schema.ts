import { type QueryRequest, QueryRequestSchema } from "@endeavour/vue-library/models";

import * as z from "zod";

export const jobRequestSchema = z.object({
  jobName: z.string(),
  queryRequests: z.array(QueryRequestSchema),
  startOfDaySnapshot: z.boolean().default(false),
  persistent: z.boolean().default(false),
  useStartOfDaySnapshot: z.boolean().default(false)
});

export interface JobRequest {
  jobName: string;
  queryRequests: QueryRequest[];
  startOfDaySnapshot: boolean;
  persistent: boolean;
  useStartOfDaySnapshot: boolean;
}
