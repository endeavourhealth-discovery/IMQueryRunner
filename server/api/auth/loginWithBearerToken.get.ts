import Logger from "#shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/auth/loginWithBearerToken");

  try {
    await globalThis.authenticator.loginWithBearerToken(event);
  } catch (ex) {
    LOG.debug("Error logging in with token");
    LOG.debug(ex);
    throw ex;
  }
});
