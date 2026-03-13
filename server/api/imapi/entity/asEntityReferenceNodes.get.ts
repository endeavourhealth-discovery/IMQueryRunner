import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const paramSchema = z.object({
  iris: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get entities as reference node",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iris",
        description: "Entity iris as comma separated string",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iris } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getAsEntityReferenceNodes(
    sessionId,
    iris.split(","),
  );
});
