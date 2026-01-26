import type { NitroApp } from "nitropack";
import type {User} from "~~/models/User";
import { H3Event, EventHandlerRequest } from 'h3';

interface EndSecApi {
  getUser(event: H3Event<EventHandlerRequest>): Promise<User>
  checkPermissions(event: H3Event<EventHandlerRequest>): Promise<boolean>
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  globalThis.apiGuard = {
    getUser: async (event: H3Event<EventHandlerRequest>): Promise<User> => {
      return await event.$fetch<User>("/api/auth/getUser")
    },
    checkPermissions: async (event: H3Event<EventHandlerRequest>): Promise<boolean> => {
      const path = getRequestURL(event).pathname;
      return await event.$fetch<boolean>("/api/auth/hasPermission", {
        method: "POST",
        query: {
          object: path,
          action: event.method,
        }
      })
    }
  } as EndSecApi
});
