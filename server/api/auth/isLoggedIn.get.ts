import Logger from "#shared/logger";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/auth/isLoggedIn");

  try {
    const user = globalThis.authenticator.getUser(event);
    return !!user;
  } catch (ex) {
    LOG.debug("Error getting user");
    LOG.debug(ex);
    throw ex;
  }
});
