import type { EndSecApi } from "~~/shared/EndSecApi";

import { NAMESPACE, Resource, UserRole } from "@endeavour/vue-library/enums";
import type { User } from "@endeavour/vue-library/models";

import { EventHandlerRequest, H3Event } from "h3";
import type { NitroApp } from "nitropack";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  globalThis.apiGuard = {
    getUser: async (event: H3Event<EventHandlerRequest>): Promise<User> => {
      return await event.$fetch<User>("/api/auth/user", { method: "GET" });
    },
    checkPermissions: async (event: H3Event<EventHandlerRequest>): Promise<boolean> => {
      const path = getRequestURL(event).pathname;
      return await event.$fetch<boolean>("/api/auth/hasPermission", {
        method: "POST",
        body: {
          resource: Resource.QUERY,
          allowableRoles: [UserRole.ADMIN],
          requiredNamespaces: [{ iri: NAMESPACE.IM, read: true, write: true }]
        }
      });
    },
    updateUser: async (event: H3Event<EventHandlerRequest>, user: User): Promise<User> => {
      return await event.$fetch<User>("/api/auth/updateUser", {
        method: "POST",
        body: user
      });
    }
  } as EndSecApi;
});
