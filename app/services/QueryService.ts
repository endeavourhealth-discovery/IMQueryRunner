import { DisplayMode } from "@endeavour/vue-library/enums";
import { isArrayHasLength, isObjectHasKeys } from "@endeavour/vue-library/helpers";
import type {
  ArgumentReference,
  IMLLanguage,
  Indicator,
  PathQuery,
  Query,
  QueryRequest,
  QueryResponse,
  Return,
  SearchResponse,
  TTEntity
} from "@endeavour/vue-library/models";

const API_URL = "api/imapi/query";

const QueryService = {
  async queryIM(query: QueryRequest, controller?: AbortController, raw: boolean = false): Promise<QueryResponse> {
    if (controller)
      return await useApi<QueryResponse>(API_URL + "/queryIM", {
        body: query,
        signal: controller.signal,
        raw: raw,
        method: "POST"
      });
    else
      return await useApi<QueryResponse>(API_URL + "/queryIM", {
        body: query,
        raw: raw,
        method: "POST"
      });
  },
  async flattenBooleans(query: Query): Promise<Query> {
    return await $fetch<Query>(API_URL + "/flattenBooleans", {
      body: query,
      method: "POST"
    });
  },
  async optimiseECLQuery(query: Query): Promise<Query> {
    return await $fetch<Query>(API_URL + "/optimiseECLQuery", {
      body: query,
      method: "POST"
    });
  },

  async queryIMSearch(query: QueryRequest, controller?: AbortController, raw: boolean = false): Promise<SearchResponse> {
    return await $fetch<SearchResponse>(API_URL + "/queryIMSearch", {
      body: query,
      signal: controller?.signal,
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async askQuery(query: QueryRequest, controller?: AbortController, raw: boolean = false): Promise<boolean> {
    return await $fetch<boolean>(API_URL + "/askQueryIM", {
      body: query,
      signal: controller?.signal,
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async getQueryDisplayFromQuery(query: Query, displayMode: DisplayMode): Promise<Query> {
    return await $fetch<Query>(API_URL + "/queryDisplayFromQuery", {
      body: { query: query, displayMode: displayMode },
      method: "POST"
    });
  },

  async getDisplayFromIndicatorIri(iri: string): Promise<Indicator> {
    return await $fetch<Indicator>(API_URL + "/indicatorDisplay", {
      params: { queryIri: iri },
      method: "GET"
    });
  },

  async expandCohort(queryIri: string, cohortIri: string, displayMode: DisplayMode): Promise<Query> {
    return await $fetch<Query>(API_URL + "/expandCohort", {
      params: {
        queryIri: queryIri,
        cohortIri: cohortIri,
        displayMode: displayMode
      },
      method: "GET"
    });
  },

  async generateQuerySQL(queryIri: string, lang?: string): Promise<string> {
    return await $fetch<string>(API_URL + "/sql", {
      params: { queryIri: queryIri, lang: lang },
      method: "GET"
    });
  },

  async generateQueryIML(queryIri: string): Promise<IMLLanguage> {
    return await $fetch<IMLLanguage>(API_URL + "/imlFromIri", {
      params: { queryIri: queryIri },
      method: "GET"
    });
  },

  async findMissingArguments(queryRequest: QueryRequest): Promise<ArgumentReference[]> {
    return await $fetch<ArgumentReference[]>(API_URL + "/findRequestMissingArguments", {
      body: queryRequest,
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
