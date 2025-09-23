import { z } from "zod";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  const { code } = await getValidatedQuery(event, paramSchema.parse);
  await globalThis.authenticator.getTokensFromCode(event, code);
});
