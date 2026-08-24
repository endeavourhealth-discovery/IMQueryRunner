import type { QueryRequest } from "@endeavour/vue-library/models";

export interface JobRequest {
  jobName: string;
  queryRequests: QueryRequest[];
  startOfDaySnapshot: boolean;
  persistent: boolean;
  useStartOfDaySnapshot: boolean;
}
