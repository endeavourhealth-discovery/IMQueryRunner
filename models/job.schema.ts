import { z } from "zod";
import { JobStatus } from "~~/enums";

export const jobSchema = z.object({
  id: z.number().int(),
  jobName: z.string(),
  queryRequests: z.array(z.any()),
  startOfDaySnapshot: z.number().int(),
  persistent: z.number().int(),
  useStartOfDaySnapshot: z.number().int(),
  userId: z.string(),
  queueDate: z.string(),
  runDate: z.string(),
  finishDate: z.string().optional(),
  status: z.enum(JobStatus),
  error: z.any().optional(),
});
export type Job = z.infer<typeof jobSchema>;
