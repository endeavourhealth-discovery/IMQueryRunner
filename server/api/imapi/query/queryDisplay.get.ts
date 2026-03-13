import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const paramSchema = z.object({
  iri: z.string(),
  displayMode: z.enum(DisplayMode),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Query iri",
        in: "query",
      },
      {
        name: "Display mode",
        description: "Mode to return the display",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, displayMode } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.getDisplayFromQueryIri(sessionId, iri, displayMode);
});
