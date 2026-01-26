import Logger from "~~/shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/middleware/auth");
  LOG.info("auth middleware");

  // Ignore ui routes, public api's and auth api's
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api")
    || path.startsWith("/api/public")
    || path.startsWith("/api/auth")) {
    return;
  }

  await globalThis.apiGuard.checkPermissions(event);
});
