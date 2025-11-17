import Logger from "~~/shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/middleware/auth");
  LOG.info("auth middleware");
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api")) {
    return;
  }

  // Authentication
  const publicRoutes = [
    "/api/auth/loginUrl",
    "/api/auth/authenticate",
    "/api/auth/logout",
    "/api/auth/loginWithBearerToken",
    "/api/auth/loginWithSessionId",
    "/api/auth/isLoggedIn",
    "/api/oauth/token",
    "/api/public/auth/hasPermission",
  ];

  if (publicRoutes.includes(path)) {
    return;
  }

  await globalThis.authenticator.requireUser(event);
});
