
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const accessToken = getCookie(event, "access_token");
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Access token not found in cookies"
    });
  }

  return await globalThis.security.hasPermission(accessToken, body.object, body.action);
});
