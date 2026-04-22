import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import SetService from "~~/server/services/SetService";

const paramSchema = z.object({
  iri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Publish set",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Set iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await SetService.publish(sessionId, iri);
});
