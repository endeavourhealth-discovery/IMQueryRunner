import { REPO } from "@endeavour/vue-library/enums";
import type { GithubRelease } from "@endeavour/vue-library/models";

const API_URL = "api/imapi/github";

const GithubService = {
  async getLatestRelease(repositoryName: REPO) {
    return await $fetch<GithubRelease>(API_URL + "/latestRelease", { method: "GET", params: { repositoryName: repositoryName } });
  },

  async getReleases(repositoryName: REPO) {
    return await $fetch<GithubRelease[]>(API_URL + "/allReleases", { method: "GET", params: { repositoryName: repositoryName } });
  }
};

export default GithubService;
