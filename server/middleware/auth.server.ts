import { apiGuard } from "~~/server/utils/security/api.guard";

export default defineEventHandler(async (event) => {
  console.log("API : server auth middleware");
  console.log(getHeaders(event));
  const path = getRequestURL(event).pathname;
  console.log("API : path=" + path);
  if (!path.startsWith("/api")) return;

  // Authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/oauth/token",
    "/api/public/auth/hasPermission",
  ];
  if (!publicRoutes.includes(path)) {
    await requireUserSession(event);
  }

  // Authorization
  const user = await getUserSession(event);
  console.log("API : middleware user ");
  console.log(user);
  const method = event.method;
  if (user?.user) {
    const allowed = await apiGuard.checkPermissions(user.user, path, method);

    console.log(`API: Permission on route [${method}:${path}] = ${allowed}`);
    if (!allowed) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
  }
});
