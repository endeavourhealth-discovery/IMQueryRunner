import type { JobStatus } from "~~/enums";

/** Sent to a user's browser over the websocket when one of their jobs changes. */
export interface QueueUpdate {
  jobId: number;
  /** The job's new status, when the change was a status change. */
  status?: JobStatus;
}
