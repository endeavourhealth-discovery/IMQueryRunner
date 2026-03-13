import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const paramSchema = z.object({
  queryIri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get indicator display",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "queryIri",
        description: "Query iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { queryIri } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.getDisplayFromIndicatorIri(sessionId, queryIri);
});
