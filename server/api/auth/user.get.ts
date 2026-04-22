import { getIp } from "~~/server/helpers/getIp";

import { type User } from "vue-library/models";

export default defineEventHandler(async (event): Promise<User> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  return await $fetch<User>(`${EndSecHost}/api/${EndSecApp}/authn/getUser`, {
    headers: { "x-client-ip": clientIp },
    query: {
      sessionId: sessionId
    }
  });
});
