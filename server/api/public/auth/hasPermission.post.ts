
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const user = globalThis.authenticator.getUser(event);

  return await globalThis.guard.checkPermissions(user, body.object, body.action);
});
