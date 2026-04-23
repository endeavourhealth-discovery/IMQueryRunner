import type { QueryRequest } from "vue-library";

export interface JobRequest {
  jobName: string;
  queryRequests: QueryRequest[];
  startOfDaySnapshot: boolean;
  persistent: boolean;
  useStartOfDaySnapshot: boolean;
}
