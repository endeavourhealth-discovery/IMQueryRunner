import {apiAuth} from "~~/server/security/api.auth";
import {apiGuard} from "~~/server/security/api.guard";


export default defineEventHandler(async (event) => {

  // Authentication
  const token = getCookie(event,"jwtToken");
  apiAuth.initialize(token, useRuntimeConfig());


  // Authorization
  const user = apiAuth.getUser();
  const path = getRequestURL(event).pathname;
  const method = event.method;

  const allowed = await apiGuard.checkPermissions(user, path, method);

  console.log(`API: Permission on route [${method}:${path}] = ${allowed}`);
  if (!allowed) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
})