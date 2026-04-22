import * as z from "zod";
import { JobStatus } from "~~/enums";

export const jobSchema = z.object({
  dbid: z.uuid(),
  jobName: z.string(),
  queryRequest: z.any(),
  queryHash: z.string(),
  queryType: z.string(),
  userId: z.uuid(),
  queueDate: z.string().optional(),
  runDate: z.string().optional(),
  finishDate: z.string().optional(),
  pid: z.number().optional(),
  status: z.enum(JobStatus),
  error: z.any().optional(),
});

export type Job = z.infer<typeof jobSchema>;
