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
export default defineEventHandler(async (event): Promise<any> => {
  const { repositoryName } = await getQueryParams(event, paramSchema.parse);
  return await GithubService.getAllReleases(repositoryName);
});
