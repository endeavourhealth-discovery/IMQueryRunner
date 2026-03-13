import type {
  Match,
  PathQuery,
  Query,
  QueryRequest,
  QueryResponse,
  SearchResponse,
  ArgumentReference,
  IMLLanguage,
  Indicator,
  Return,
  TTEntity,
} from "vue-library/interfaces";
import { DisplayMode } from "vue-library/enums";
import { isArrayHasLength, isObjectHasKeys } from "vue-library/helpers";

const API_URL = "api/impai/query";

const QueryService = {
  async queryIM(
    query: QueryRequest,
    controller?: AbortController,
    raw: boolean = false,
  ): Promise<QueryResponse> {
    if (controller)
      return await $fetch(API_URL + "/queryIM", {
        body: query,
        signal: controller.signal,
        raw: raw,
        method: "POST",
      });
    else
      return await $fetch(API_URL + "/queryIM", {
        body: query,
        raw: raw,
        method: "POST",
      });
  },
  async flattenBooleans(query: Query | Match): Promise<Query | Match> {
    return await $fetch(API_URL + "/flattenBooleans", {
      body: query,
      method: "POST",
    });
  },
  async optimiseECLQuery(query: Query): Promise<Query> {
    return await $fetch(API_URL + "/optimiseECLQuery", {
      body: query,
      method: "POST",
    });
  },

  async queryIMSearch(
    query: QueryRequest,
    controller?: AbortController,
    raw: boolean = false,
  ): Promise<SearchResponse> {
    return await $fetch(API_URL + "/queryIMSearch", {
      body: query,
      signal: controller?.signal,
      raw: raw,
      method: "POST",
    });
  },

  async askQuery(
    query: QueryRequest,
    controller?: AbortController,
    raw: boolean = false,
  ): Promise<boolean> {
    return await $fetch(API_URL + "/askQueryIM", {
      body: query,
      signal: controller?.signal,
      raw: raw,
      method: "POST",
    });
  },

  async getQueryDisplayFromQuery(
    query: Query,
    displayMode: DisplayMode,
  ): Promise<Query> {
    return await $fetch(API_URL + "/queryDisplayFromQuery", {
      body: { query: query, displayMode: displayMode },
      method: "POST",
    });
  },

  async getDisplayFromIndicatorIri(iri: string): Promise<Indicator> {
    return await $fetch(API_URL + "/indicatorDisplay", {
      params: { queryIri: iri },
      method: "GET",
    });
  },

  async expandCohort(
    queryIri: string,
    cohortIri: string,
    displayMode: DisplayMode,
  ): Promise<Query> {
    return await $fetch(API_URL + "/expandCohort", {
      params: {
        queryIri: queryIri,
        cohortIri: cohortIri,
        displayMode: displayMode,
      },
      method: "GET",
    });
  },

  async generateQuerySQL(queryIri: string, lang?: string): Promise<string> {
    return await $fetch(API_URL + "/sql", {
      params: { queryIri: queryIri, lang: lang },
      method: "GET",
    });
  },

  async generateQueryIML(queryIri: string): Promise<IMLLanguage> {
    return await $fetch(API_URL + "/imlFromIri", {
      params: { queryIri: queryIri },
      method: "GET",
    });
  },
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
