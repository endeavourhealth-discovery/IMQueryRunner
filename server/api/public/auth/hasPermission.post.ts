export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const user = globalThis.authenticator.getUser(event);

  if (!user) return false;

  return await globalThis.guard.checkPermissions(
    user,
    body.resource,
    body.action
  );
});
