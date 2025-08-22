import { z } from "zod";
import { QueueItemStatus } from "~~/enums";

export const queueItemSchema = z.object({
  id: z.uuid(),
  queryIri: z.url(),
  queryName: z.string(),
  queryRequest: z.any(),
  userId: z.uuid(),
  username: z.string(),
  queuedAt: z.date().optional(),
  startedAt: z.date().optional(),
  pid: z.number().optional(),
  finishedAt: z.date().optional(),
  killedAt: z.date().optional(),
  status: z.enum(QueueItemStatus),
  queryResult: z.array(z.string()),
  error: z.any(),
});
