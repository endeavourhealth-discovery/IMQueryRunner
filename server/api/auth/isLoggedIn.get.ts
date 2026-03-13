import { getIp } from "~~/server/helpers/getIp";

export default defineEventHandler(async (event): Promise<boolean> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  try {
    const user = await $fetch<string>(
      `${EndSecHost}/api/${EndSecApp}/authn/getUser`,
      {
        headers: { "x-client-ip": clientIp },
        query: {
          sessionId: sessionId,
        },
      },
    );
    if (user) return true;
    return false;
  } catch (e: any) {
    return false;
  }
});
