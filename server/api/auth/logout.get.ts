export default defineEventHandler(async (event): Promise<void> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;

  await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/logout`, {
    query: {
      sessionId: sessionId,
    },
  });
  setCookie(event, "session_id", "", { httpOnly: true, maxAge: 0 });
  return;
});
