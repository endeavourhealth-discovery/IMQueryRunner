import Logger from "~~/shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/middleware/auth");
  const path = getRequestURL(event).pathname;
  LOG.info("auth middleware [" + path + "]");
  if (!path.startsWith("/api")) {
    LOG.debug("Not an API route. Skipping");
    return;
  }

  // Authentication
  const publicRoutes = [
    "/api/auth/loginUrl",
    "/api/auth/authenticate",
    "/api/auth/logout",
    "/api/oauth/token",
    "/api/public/auth/hasPermission",
  ];

  if (publicRoutes.includes(path) || path.startsWith(process.env.AUTH_URL as string)) {
    return;
  }

  // Authorization
  const accessToken = getCookie(event, "access_token");
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  const method = event.method;
  const allowed = await globalThis.guard.hasPermission(accessToken, path, method);
    if (!allowed) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
});
