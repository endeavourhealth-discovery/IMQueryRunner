import { getQueryParams } from "~~/server/helpers/getQueryParams";
import GithubService from "~~/server/services/GithubService";

import { REPO } from "vue-library/enums";

import * as z from "zod";

const paramSchema = z.object({
  repositoryName: z.enum(REPO)
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get latest github release details for repo",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "repositoryName", description: "Name of the github repository as a REPO enum", in: "query" }
    ]
  }
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { repositoryName } = await getQueryParams(event, paramSchema.parse);
  return await GithubService.getLatestRelease(sessionId, repositoryName);
});
