import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EntityService from "~~/server/services/EntityService";

const bodySchema = z.object({
  typeIris: z.array(z.string()),
  predicates: z.array(z.string()),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get multiple partial entities",
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
              "Request allowing for multiple getPartial requests at once",
            properties: {
              typeIris: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "List of type IRIs",
              },
              predicates: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "List of predicates to retrieve",
              },
            },
            required: ["typeIris", "predicates"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { typeIris, predicates } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await EntityService.getPartialEntities(
    sessionId,
    typeIris,
    predicates,
  );
});
