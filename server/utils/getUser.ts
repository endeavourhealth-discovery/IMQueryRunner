import type { User } from "casdoor-nodejs-sdk/lib/cjs/user";
import type { H3Event, EventHandlerRequest } from "h3";

export function getUser(event: H3Event<EventHandlerRequest>): User | undefined {
  const userJson = getCookie(event, "casdoor_user");
  if (userJson) return JSON.parse(userJson);
  return undefined;
}
