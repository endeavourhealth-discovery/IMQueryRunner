
export default defineEventHandler(async (event) => {
  await globalThis.security.logout(event);
});
