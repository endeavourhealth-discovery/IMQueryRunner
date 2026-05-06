import { REPO } from "@endeavour/vue-library/enums";
import type { GithubRelease } from "@endeavour/vue-library/interfaces";

const API_URL = `${useRuntimeConfig().public.imapiUrl}github`;

const GithubService = {
  async getLatestRelease(sessionId: string, repositoryName: REPO): Promise<GithubRelease> {
    return await $fetch<GithubRelease>(API_URL + "/public/githubLatest", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      params: { repositoryName: repositoryName },
      method: "GET"
    });
  },

  async getAllReleases(sessionId: string, repositoryName: REPO): Promise<GithubRelease[]> {
    return await $fetch<GithubRelease[]>(API_URL + "/public/githubAllReleases", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      params: { repositoryName: repositoryName },
      method: "GET"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(GithubService);

export default GithubService;
