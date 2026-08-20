import { getIp } from "~~/server/helpers/getIp";

export default defineEventHandler(async (event): Promise<string> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  return await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/getProfileUrl`, { params: { sessionId: sessionId }, method: "GET" });
});
