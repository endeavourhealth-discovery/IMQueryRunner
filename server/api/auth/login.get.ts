import { z } from "zod";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  console.log("API : logging-in");
  const { code } = await getValidatedQuery(event, paramSchema.parse);
  console.log("Swapping code ", code, " for token"  );
  await globalThis.authenticator.getTokensFromCode(event, code);
  console.log("API : success logged in");
  console.log(globalThis.authenticator.getUser(event))
});
