
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("API : checking permissions");
  const user = globalThis.authenticator.getUser(event);

  console.log("API : User ", user?.name);

  return await globalThis.guard.checkPermissions(user, body.object, body.action);
});
