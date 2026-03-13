import { H3Event, type EventHandlerRequest } from "h3";
import type { User } from "vue-library/models";

export interface EndSecApi {
  getUser(event: H3Event<EventHandlerRequest>): Promise<User>;
  checkPermissions(event: H3Event<EventHandlerRequest>): Promise<boolean>;
  updateUser(event: H3Event<EventHandlerRequest>, user: User): Promise<User>;
}
