import type { QueryRequest } from "@endeavour/vue-library/models";

export interface RabbitMessage {
  data: QueryRequest;
  user_id: string;
  token: string;
}
