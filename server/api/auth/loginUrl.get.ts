import {z} from "zod";

const paramSchema = z.object({
  redirectUri: z.string(),
  state: z.string(),
});

export default defineEventHandler(async (event) => {
  const { redirectUri, state } = await getValidatedQuery(event, paramSchema.parse);
  return globalThis.authenticator.getLoginUrl(redirectUri, state);
});
