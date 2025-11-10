import { z } from "zod";

const paramSchema = z.object({
  origin: z.string(),
  redirectUrl: z.string(),
});

export default defineEventHandler(async (event) => {
  const { origin, redirectUrl } = await getValidatedQuery(
    event,
    paramSchema.parse
  );
  return globalThis.authenticator.getLoginUrl(origin!, redirectUrl);
});
