import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";

const paramSchema = object({
  descendant: string(),
  ancestor: string(),
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
