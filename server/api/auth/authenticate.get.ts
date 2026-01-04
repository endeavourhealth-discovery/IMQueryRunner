import { z } from "zod";
import Logger from "#shared/logger";

const paramSchema = z.object({
  code: z.string(),
  redirectUri: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/auth/authenticate")
  const { code, redirectUri } = await getValidatedQuery(event, paramSchema.parse);

  try {
    LOG.debug("=================== TOKENS FROM CODE ===================")
    LOG.debug("Code: " + code)
    LOG.debug("Redirect URI: " + redirectUri)
    await globalThis.security.getTokensFromCode(event, code, redirectUri);
  } catch (ex) {
    LOG.debug("Error exchanging code for token");
    LOG.debug(ex);
    throw ex;
  }
});
