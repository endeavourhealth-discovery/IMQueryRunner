import { getQueryParams } from "~~/server/helpers/getQueryParams";
import {
  any,
  array,
  boolean,
  number,
  object,
  string,
  enum as zenum,
} from "zod/v4";
import SetService from "~~/server/services/SetService";

const paramSchema = object({
  iri: string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get subsets",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Set iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await SetService.getSubsets(sessionId, iri);
});
