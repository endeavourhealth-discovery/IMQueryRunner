import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";
import FilerService from "~~/server/services/FilerService";

const bodySchema = object({
  entity: string(),
  oldFolder: string(),
  newFolder: string(),
}).openapi({
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
