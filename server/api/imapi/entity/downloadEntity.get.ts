import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";
import { filterOptionsSchema } from "~~/models/filterOptions.schema";

const paramSchema = z.object({
  iri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Download entity",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.downloadEntity(sessionId, iri);
});
