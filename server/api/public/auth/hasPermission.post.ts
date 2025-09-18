import { getUser } from "~~/server/utils/getUser";
import { apiGuard } from "~~/server/utils/security/api.guard";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("API : checking permissions");
  const user = getUser(event);
  if (!user) throw createError({ statusCode: 401, message: "No user found" });

  return await apiGuard.checkPermissions(user, body.object, body.action);
});
