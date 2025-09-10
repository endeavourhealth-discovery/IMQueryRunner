import {apiAuth} from "~~/server/utils/security/api.auth";
import {apiGuard} from "~~/server/utils/security/api.guard";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const user = apiAuth.getUser();

  return await apiGuard.checkPermissions(user, body.object, body.action);
});
