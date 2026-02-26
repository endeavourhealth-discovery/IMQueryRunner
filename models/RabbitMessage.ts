import type { QueryRequest } from "vue-library/interfaces";

export interface RabbitMessage {
  data: QueryRequest;
  user_id: string;
  token: string;
}
