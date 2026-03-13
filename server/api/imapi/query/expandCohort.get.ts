import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string, enum as zenum } from "zod/v4";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const paramSchema = object({
  queryIri: string(),
  cohortIri: string(),
  displayMode: zenum(DisplayMode),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "queryIri",
        description: "Query iri",
        in: "query",
      },
      {
        name: "cohortIri",
        description: "Cohort iri",
        in: "query",
      },
      {
        name: "Display mode",
        description: "Mode to return the display",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { queryIri, cohortIri, displayMode } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await QueryService.expandCohort(
    sessionId,
    queryIri,
    cohortIri,
    displayMode,
  );
});
