export enum JobStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ERRORED = "ERRORED",
}

export function isJobStatus(input: string) {
  return (<any>Object).values(JobStatus).includes(input);
}
