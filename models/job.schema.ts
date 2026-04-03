import { z } from "zod";
import { JobStatus } from "~~/enums";

export const jobSchema = z.object({
  dbid: z.number().int(),
  jobName: z.string(),
  queryIri: z.string(),
  queryDefinition: z.any(),
  queryType: z.string(),
  searchDate: z.string().optional(),
  achievementDate: z.string().optional(),
  hash: z.number(),
  userId: z.string(),
  queueDate: z.string(),
  runDate: z.string(),
  finishDate: z.string().optional(),
  pid: z.number().optional(),
  status: z.enum(JobStatus),
  error: z.any().optional(),
});
export type Job = z.infer<typeof jobSchema>;
