import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iris: z.string().min(1)
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get entities as tree nodes (name, type, whether they have children)",
    parameters: [
      {
        name: "iris",
        description: "Entity iris as comma separated string",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const { iris } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getAsEntityReferenceNodes(accessToken, iris.split(","));
});
