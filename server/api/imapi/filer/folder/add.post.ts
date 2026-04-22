import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import FilerService from "~~/server/services/FilerService";

const bodySchema = z.object({
  entity: z.string(),
  folder: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Add folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary:
              "Add a new folder to a new location in the information model hierarchy",
            properties: {
              entity: {
                type: "string",
                description: "Iri of new entity",
              },
              folder: {
                type: "string",
                description: "Iri of the folder",
              },
            },
            required: ["entity", "folder"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { entity, folder } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.addToFolder(sessionId, entity, folder);
});
