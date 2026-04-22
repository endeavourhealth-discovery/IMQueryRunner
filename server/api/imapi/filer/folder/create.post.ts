import { getQueryParams } from "~~/server/helpers/getQueryParams";
import FilerService from "~~/server/services/FilerService";

import * as z from "zod";

const bodySchema = z.object({
  container: z.string(),
  name: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Create folder",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Create a new folder in the information model hierarchy",
            properties: {
              container: {
                type: "string",
                description: "Iri of new folder"
              },
              name: {
                type: "string",
                description: "Name of the new folder"
              }
            },
            required: ["container", "name"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { container, name } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.createFolder(sessionId, container, name);
});
