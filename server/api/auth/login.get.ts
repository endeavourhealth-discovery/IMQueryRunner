import { z } from "zod";
import { setAuthCookies } from "~~/server/utils/setAuthCookies";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  console.log("API : logging-in");
  const { code } = await getValidatedQuery(event, paramSchema.parse);
  const tokens = await globalThis.casdoor.getAuthToken(code);
  setAuthCookies(event, tokens);
  console.log("API : success logged in");
});
