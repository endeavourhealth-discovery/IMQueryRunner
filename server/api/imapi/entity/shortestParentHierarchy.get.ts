import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const paramSchema = z.object({
  descendant: z.string(),
  ancestor: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get path between nodes",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "descendant",
        description: "Descendant iri",
        in: "query",
      },
      {
        name: "ancestor",
        description: "Ancestor iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { descendant, ancestor } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await EntityService.getPathBetweenNodes(
    sessionId,
    descendant,
    ancestor,
  );
});
