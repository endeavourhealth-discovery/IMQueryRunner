import { QueueItemStatus } from "../enums/index";
import type { QueryRequest } from "./AutoGen";

export interface QueueItem {
  id: string;
  queryIri: string;
  queryName: string;
  queryRequest: QueryRequest;
  userId: string;
  username: string;
  queuedAt: Date;
  startedAt: Date;
  pid: number;
  finishedAt: Date;
  killedAt: Date;
  status: QueueItemStatus;
  queryResult: string;
  error: string;
}
