export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api")) {
    console.log("API : Not an API route, skipping auth middleware");
    return;
  }

  console.log("API : server auth middleware");
  console.log("API : path=" + path);

  // Authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/oauth/token",
    "/api/public/auth/hasPermission",
  ];

  if (publicRoutes.includes(path)) {
    console.log("API : Public route, skipping auth middleware");
    return;
  }

  console.log("API : Performing Authentication");
  await globalThis.authenticator.requireUser(event);
  // Authorization
  const user = globalThis.authenticator.getUser(event);
  console.log("API : middleware user ");
  const method = event.method;
  if (user) {
    const allowed = await globalThis.guard.checkPermissions(user, path, method);
    console.log(`API: Permission on route [${method}:${path}] = ${allowed}`);
    if (!allowed) {
      console.log("API : Logged in but not authorized")
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    } else {
      console.log("API : Authorized");
    }
  } else {
    console.log("API : No user found (not logged in)");
  }
});
