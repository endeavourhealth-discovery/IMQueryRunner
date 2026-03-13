import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  ecl: string(),
  showNames: boolean(),
}).openapi({ description: "Ecl model validation request" });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate model using ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { ecl, showNames } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.validateModelFromECL(sessionId, ecl, showNames);
});
