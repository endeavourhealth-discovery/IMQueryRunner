import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import FilerService from "~~/server/services/FilerService";

const bodySchema = object({
  container: string(),
  name: string(),
}).openapi({
  description: "Create a new folder in the information model hierarchy",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Create folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { container, name } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.createFolder(sessionId, container, name);
});
