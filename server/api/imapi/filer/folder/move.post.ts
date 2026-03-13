import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";
import FilerService from "~~/server/services/FilerService";

const bodySchema = z
  .object({
    entity: z.string(),
    oldFolder: z.string(),
    newFolder: z.string(),
  })
  .openapi({
    description:
      "Move folder to a new location in the information model hierarchy",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Move folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { entity, oldFolder, newFolder } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await FilerService.moveFolder(sessionId, entity, oldFolder, newFolder);
});
