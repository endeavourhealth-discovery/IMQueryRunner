import type { QueryRequest } from "./AutoGen";

export interface JobRequest {
  jobName: string;
  queryRequests: QueryRequest[];
  startOfDaySnapshot: boolean;
  persistent: boolean;
  useStartOfDaySnapshot: boolean;
}
