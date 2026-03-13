import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import FilerService from "~~/server/services/FilerService";

const bodySchema = z
  .object({
    entity: z.string(),
    folder: z.string(),
  })
  .openapi({
    description:
      "Add a new folder to a new location in the information model hierarchy",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Add folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { entity, folder } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.addToFolder(sessionId, entity, folder);
});
