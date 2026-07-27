import { parseArray } from "@endeavour/vue-library";
import { REPO } from "@endeavour/vue-library/enums";
import { type GithubRelease, GithubReleaseSchema } from "@endeavour/vue-library/models";

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
    return GithubReleaseSchema.parse(result);
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
    return parseArray(result, GithubReleaseSchema);
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(GithubService);

export default GithubService;
