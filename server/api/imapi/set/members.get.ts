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
  entailments: boolean(),
  page: number(),
  size: number(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get members",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Set iri",
        in: "query",
      },
      {
        name: "entailments",
        description: "Include entailments",
        in: "query",
      },
      {
        name: "page",
        description: "Page number",
        in: "query",
      },
      {
        name: "size",
        description: "Page size",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, entailments, page, size } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await SetService.getMembers(sessionId, iri, entailments, page, size);
});
