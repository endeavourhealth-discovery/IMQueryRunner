import { apiGuard } from "~~/server/utils/security/api.guard";
import { getUser } from "../utils/getUser";
import { requireUser } from "../utils/requireUser";
import {setAuthCookies} from "~~/server/utils/setAuthCookies";

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

  // Attempt to inject user if Auth header sent
  if (event.headers.has("Authorization")) {
    const parts = event.headers.get("Authorization")!.split(" ");
    if (parts.length == 2) {
      console.log("API : Injecting cookies from token");
      setAuthCookies(event, parts[1])
    }
  }

  console.log("API : Performing Authentication");
  console.log("Cookies: ", getCookie(event, "casdoor_user"));
  await requireUser(event);
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
