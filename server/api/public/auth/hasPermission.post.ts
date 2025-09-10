import {apiAuth} from "~~/server/utils/security/api.auth";
import {apiGuard} from "~~/server/utils/security/api.guard";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return await apiGuard.checkPermissions(apiAuth.getUser(), body.object, body.action);
});
