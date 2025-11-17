import Logger from "#shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/auth/loginWithBearerToken");

  try {
    await globalThis.authenticator.loginWithSessionId(event);
  } catch (ex) {
    LOG.debug("Error logging in with session id");
    LOG.debug(ex);
    throw ex;
  }
});
