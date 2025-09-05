export default defineEventHandler(async (event) => {
  await authenticator.checkPermissions(event)
})