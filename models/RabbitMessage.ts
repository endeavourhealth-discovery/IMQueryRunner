import type { QueryRequest } from "vue-library";

export interface RabbitMessage {
  data: QueryRequest;
  user_id: string;
  token: string;
}
