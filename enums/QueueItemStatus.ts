export enum QueueItemStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ERRORED = "ERRORED",
}

export function isQueueItemStatus(input: string) {
  return (<any>Object).values(QueueItemStatus).includes(input);
}
