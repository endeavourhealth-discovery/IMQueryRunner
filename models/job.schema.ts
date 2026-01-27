import { z } from "zod";
import { JobStatus } from "~~/enums";

export const jobSchema = z.object({
  id: z.uuid(),
  jobName: z.string(),
  queryIri: z.url(),
  queryRequest: z.any(),
  userId: z.uuid(),
  userName: z.string(),
  queuedAt: z.string().optional(),
  startedAt: z.string().optional(),
  pid: z.number().optional(),
  stoppedAt: z.string().optional(),
  status: z.enum(JobStatus),
  queryResult: z.array(z.string()).optional(),
  error: z.any().optional(),
});

export type Job = z.infer<typeof jobSchema>;
