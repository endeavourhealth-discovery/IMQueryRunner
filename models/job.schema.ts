import { JobStatus } from "~~/enums";

import { type QueryRequest, QueryRequestSchema } from "@endeavour/vue-library";

import * as z from "zod";

export const jobSchema = z.object({
  id: z.number().int(),
  jobName: z.string(),
  queryRequests: z.array(QueryRequestSchema),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  userId: z.string(),
  queueDate: z.string(),
  runDate: z.string(),
  finishDate: z.string().nullable().optional(),
  status: z.enum(JobStatus),
  error: z.any().optional()
});

export interface Job {
  id: number;
  jobName: string;
  queryRequests: QueryRequest[];
  startOfDaySnapshot: number;
  persistent: number;
  useStartOfDaySnapshot: number;
  userId: string;
  queueDate: string;
  runDate: string;
  finishDate?: string | null;
  status: JobStatus;
  error?: any;
}
// export type Job = z.infer<typeof jobSchema>;
