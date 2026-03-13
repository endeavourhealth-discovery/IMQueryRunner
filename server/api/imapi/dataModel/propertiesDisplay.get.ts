import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { boolean, object, string } from "zod/v4";
import DataModelService from "~~/server/services/DataModelService";

const paramSchema = object({
  iri: string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get display of a given property",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "iri", description: "Iri of the property", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.getPropertiesDisplay(sessionId, iri);
});
