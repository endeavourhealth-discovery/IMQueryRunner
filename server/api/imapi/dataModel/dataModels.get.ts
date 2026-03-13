import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import DataModelService from "~~/server/services/DataModelService";

const paramSchema = z.object({
  propIri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get data models of a given property",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "propIri", description: "Iri of the property", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { propIri } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.getDataModelsFromProperty(sessionId, propIri);
});
