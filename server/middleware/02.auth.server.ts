export default defineEventHandler(async event => {
  // Ignore ui routes, public api's and auth api's
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api") || path.startsWith("/api/public") || path.startsWith("/api/auth")) {
    return;
  }

  await globalThis.apiGuard.checkPermissions(event);
});
