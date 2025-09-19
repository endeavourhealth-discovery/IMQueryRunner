import { apiGuard } from "~~/server/utils/security/api.guard";
import { getUser } from "../utils/getUser";
import { requireUser } from "../utils/requireUser";

export default defineEventHandler(async (event) => {
  console.log("API : server auth middleware");
  const path = getRequestURL(event).pathname;
  console.log("API : path=" + path);
  console.log("Cookies: ", getCookie(event, "casdoor_user"));
  if (!path.startsWith("/api")) return;
  if (path.startsWith("/api/_auth/")) return;
  console.log("API : Performing Authentication");

  // Authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/oauth/token",
    "/api/public/auth/hasPermission",
  ];
  if (!publicRoutes.includes(path)) {
    console.log("API : Require user");
    await requireUser(event);
  }
  // Authorization
  const user = getUser(event);
  console.log("API : middleware user ");
  const method = event.method;
  if (user) {
    const allowed = await apiGuard.checkPermissions(user, path, method);
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
