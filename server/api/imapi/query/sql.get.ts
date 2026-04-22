import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const paramSchema = z.object({
  queryIri: z.string(),
  lang: z.string().optional(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "queryIri",
        description: "Query iri",
        in: "query",
      },
      {
        name: "lang",
        description: "SQL language",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { queryIri, lang } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.generateQuerySQL(sessionId, queryIri, lang);
});
