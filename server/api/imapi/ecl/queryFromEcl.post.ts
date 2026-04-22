import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const bodySchema = z.object({
  ecl: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "get Query from ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Ecl to convert to Query",
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { ecl } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getQueryFromECL(sessionId, ecl);
});
