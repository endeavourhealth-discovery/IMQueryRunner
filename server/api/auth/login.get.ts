import { PermissionSchema, User } from "vue-library/models";
import { object, string } from "zod/v4";
import { getIp } from "~~/server/helpers/getIp";
import { getQueryParams } from "~~/server/helpers/getQueryParams";

const loginSchema = object({
  code: string(),
  state: string(),
});

export default defineEventHandler(async (event): Promise<User> => {
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  const loginParams = await getQueryParams(event, loginSchema.parse);
  const { sessionId, user } = await $fetch<{
    sessionId: string;
    user: User;
    state: string;
  }>(`${EndSecHost}/api/${EndSecApp}/authn/login`, {
    headers: { "x-client-ip": clientIp },
    query: {
      code: loginParams.code,
      state: loginParams.state,
    },
  });
  setCookie(event, "session_id", sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  return user;
});
