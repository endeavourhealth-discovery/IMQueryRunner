import { getIp } from "~~/server/helpers/getIp";

import { PermissionSchema, type User, UserSchema } from "vue-library/models";

export default defineEventHandler(async (event): Promise<User> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  const updatedUser = await readValidatedBody(event, UserSchema.parse);
  return await $fetch<User>(`${EndSecHost}/api/${EndSecApp}/authn/updateUser`, {
    method: "POST",
    headers: { "x-client-ip": clientIp },
    body: {
      sessionId: sessionId,
      user: updatedUser
    }
  });
});
