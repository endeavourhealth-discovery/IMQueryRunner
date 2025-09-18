import type { QueryRequest } from "./AutoGen";

export interface RabbitMessage {
  data: QueryRequest;
  user_id: string;
  token: string;
}
