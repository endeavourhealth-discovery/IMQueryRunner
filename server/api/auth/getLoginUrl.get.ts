import { getIp } from "~~/server/helpers/getIp";
import { getQueryParams } from "~~/server/helpers/getQueryParams";

import * as z from "zod";

const loginUrlSchema = z.object({
  redirectUri: z.string(),
  state: z.string()
});

export default defineEventHandler(async (event): Promise<string> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  const { redirectUri, state } = await getQueryParams(event, loginUrlSchema.parse);
  return await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/getLoginUrl`, {
    query: {
      redirectUri: redirectUri,
      state: state
    }
  });
});
