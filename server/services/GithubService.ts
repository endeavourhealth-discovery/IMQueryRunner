import { REPO } from "@endeavour/vue-library/enums";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import { type GithubRelease, GithubReleaseSchema } from "@endeavour/vue-library/models";

import z from "zod";

const API_URL = `${useRuntimeConfig().public.imapiUrl}github`;

const GithubService = {
  async getLatestRelease(sessionId: string, repositoryName: REPO): Promise<GithubRelease> {
    const result = await $fetch(API_URL + "/public/githubLatest", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      params: { repositoryName: repositoryName },
      method: "GET"
    });
    return parseApiResponse(result, GithubReleaseSchema);
  },

  async getAllReleases(sessionId: string, repositoryName: REPO): Promise<GithubRelease[]> {
    const result = await $fetch(API_URL + "/public/githubAllReleases", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      params: { repositoryName: repositoryName },
      method: "GET"
    });
    return parseApiResponse(result, z.array(GithubReleaseSchema));
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(GithubService);

export default GithubService;
