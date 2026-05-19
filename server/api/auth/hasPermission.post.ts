import { getIp } from "~~/server/helpers/getIp";

import { PermissionSchema } from "@endeavour/vue-library/models";

export default defineEventHandler(async (event): Promise<boolean> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  const permissionParams = await readValidatedBody(event, PermissionSchema.parse);
  return await $fetch<boolean>(`${EndSecHost}/api/${EndSecApp}/authz/hasPermission`, {
    method: "POST",
    headers: { "x-client-ip": clientIp },
    body: {
      permission: permissionParams,
      sessionId: sessionId
    }
  });
});
