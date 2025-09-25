import { z } from "zod";
import Logger from "#shared/logger";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/auth/authenticate")
  const { code } = await getValidatedQuery(event, paramSchema.parse);

  try {
    LOG.debug("=================== TOKENS FROM CODE ===================")
    await globalThis.authenticator.getTokensFromCode(event, code);
  } catch (ex) {
    LOG.debug("Error exchanging code for token");
    LOG.debug(ex);
    throw ex;
  }
});
