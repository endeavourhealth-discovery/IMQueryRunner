import type { Query, QueryRequest, SearchResponse } from "@endeavour/vue-library/models";

const API_URL = "api/imapi/query";

const QueryService = {
  async queryIMSearch(query: QueryRequest, controller?: AbortController, raw: boolean = false): Promise<SearchResponse> {
    return await $fetch<SearchResponse>(API_URL + "/queryIMSearch", {
      body: query,
      signal: controller?.signal,
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async getQueryFromIri(iri: string): Promise<Query> {
    return await $fetch<Query>(API_URL + "/queryFromIri", {
      params: { queryIri: iri },
      method: "GET"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
