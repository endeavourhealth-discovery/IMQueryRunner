import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import DataModelService from "~~/server/services/DataModelService";

const paramSchema = z.object({
  dmIri: z.string(),
  propIri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get properties of a given data model",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "dmIri", description: "Iri of the data model", in: "query" },
      { name: "propiri", description: "Iri of the data model", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { dmIri, propIri } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.getUIProperty(sessionId, dmIri, propIri);
});
