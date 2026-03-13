import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import DataModelService from "~~/server/services/DataModelService";

const paramSchema = z.object({
  iri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get the type of a given property",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "iri", description: "Iri of the property", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.checkPropertyType(sessionId, iri);
});
