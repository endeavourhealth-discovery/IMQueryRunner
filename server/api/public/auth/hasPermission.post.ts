import { apiGuard } from "~~/server/utils/security/api.guard";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("API : checking permissions");
  const user = await getUserSession(event);
  if (!user.user)
    throw createError({ statusCode: 401, message: "No user found" });

  return await apiGuard.checkPermissions(user.user, body.object, body.action);
});
