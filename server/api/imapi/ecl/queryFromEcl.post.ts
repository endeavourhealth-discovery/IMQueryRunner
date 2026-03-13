import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  ecl: string(),
}).openapi({ description: "Ecl to convert to Query" });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "get Query from ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { ecl } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getQueryFromECL(sessionId, ecl);
});
