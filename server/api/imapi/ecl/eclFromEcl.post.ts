import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  ecl: string(),
  showNames: boolean(),
  status: object({
    valid: boolean(),
  }),
}).openapi({
  description:
    "Ecl string with optional showNames and valid status required flags",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Convert ecl to ecl with names and validation",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const eclSearchRequest = await readValidatedBody(event, bodySchema.parse);
  return await EclService.ECLSearch(sessionId, eclSearchRequest);
});
