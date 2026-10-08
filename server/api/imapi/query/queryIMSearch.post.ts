import QueryService from "~~/server/services/QueryService";

import * as z from "zod";

const bodySchema = z.any();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Query IM",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Search the information model using a query returning a search response"
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const query = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.queryIMSearch(accessToken, query);
});
