import { getQueryParams } from "~~/server/helpers/getQueryParams";
import DataModelService from "~~/server/services/DataModelService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string(),
  pathsOnly: z.boolean()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get properties of a given data model",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "iri", description: "Iri of the data model", in: "query" },
      {
        name: "pathsOnly",
        description: "Toggle to include paths in results",
        in: "query"
      }
    ]
  }
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, pathsOnly } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.getDataModelProperties(sessionId, iri, pathsOnly);
});
