import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";
import FilerService from "~~/server/services/FilerService";

import * as z from "zod";

const bodySchema = z.object({
  entity: z.string(),
  oldFolder: z.string(),
  newFolder: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Move folder",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Create a new folder in the information model hierarchy",
            properties: {
              entity: {
                type: "string",
                description: "Iri of moving entity"
              },
              oldFolder: {
                type: "string",
                description: "Name of the old folder"
              },
              newFolder: {
                type: "string",
                description: "Name of the old folder"
              }
            },
            required: ["entity", "oldFolder", "newFolder"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { entity, oldFolder, newFolder } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.moveFolder(sessionId, entity, oldFolder, newFolder);
});
