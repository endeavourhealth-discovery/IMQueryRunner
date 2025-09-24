import { z } from "zod";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  const { code } = await getValidatedQuery(event, paramSchema.parse);

  try {
    console.log("=================== TOKENS FROM CODE ===================")
    await globalThis.authenticator.getTokensFromCode(event, code);
  } catch (ex) {
    console.log("Error exchanging code for token");
    console.log(ex);
    throw ex;
  }
});
