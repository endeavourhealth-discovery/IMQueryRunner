import type { User } from "@endeavour/vue-library/models";

import { type EventHandlerRequest, H3Event } from "h3";

export interface EndSecApi {
  getUser(event: H3Event<EventHandlerRequest>): Promise<User>;
  checkPermissions(event: H3Event<EventHandlerRequest>): Promise<boolean>;
  updateUser(event: H3Event<EventHandlerRequest>, user: User): Promise<User>;
}
