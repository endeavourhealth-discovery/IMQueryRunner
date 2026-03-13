import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import SetService from "~~/server/services/SetService";

const bodySchema = z.any().openapi({
  description: "Entity",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update subsets from super",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const entity = await readValidatedBody(event, bodySchema.parse);
  return await SetService.updateSubsetsFromSuper(sessionId, entity);
});
