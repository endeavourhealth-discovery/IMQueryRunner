import { getQueryParams } from "~~/server/helpers/getQueryParams";
import GithubService from "~~/server/services/GithubService";

import { REPO } from "@endeavour/vue-library/enums";

import * as z from "zod";

const paramSchema = z.object({
  repositoryName: z.enum(REPO)
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get all github releases for repo",
    parameters: [{ name: "repositoryName", description: "Name of the github repository as a REPO enum", in: "query" }]
  }
});
// Releases come from IMAPI, which calls the rate-limited GitHub API, and change only when something is published.
// Cached per repository (the cache key includes the query string) for 15 minutes, then refreshed in the background.
export default defineCachedEventHandler(
  async (event): Promise<any> => {
    const { repositoryName } = await getQueryParams(event, paramSchema.parse);
    return await GithubService.getAllReleases(repositoryName);
  },
  { name: "githubAllReleases", maxAge: 15 * 60, staleMaxAge: 60 * 60, swr: true }
);
