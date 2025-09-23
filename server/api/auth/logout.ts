
export default defineEventHandler(async (event) => {
  await globalThis.authenticator.logout(event);
});
