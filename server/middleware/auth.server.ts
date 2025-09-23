export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api")) {
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

  if (publicRoutes.includes(path)) {
    return;
  }

  await globalThis.authenticator.requireUser(event);
  // Authorization
  const user = globalThis.authenticator.getUser(event);
  const method = event.method;
  if (user) {
    const allowed = await globalThis.guard.checkPermissions(user, path, method);
    if (!allowed) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
  }
});
