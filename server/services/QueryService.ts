import { DisplayMode } from "@endeavour/vue-library/enums";
import { isArrayHasLength, isObjectHasKeys } from "@endeavour/vue-library/helpers";
import type {
  ArgumentReference,
  IMLLanguage,
  Indicator,
  Match,
  PathQuery,
  Query,
  QueryRequest,
  QueryResponse,
  Return,
  SearchResponse,
  SubQueryDependency,
  TTEntity
} from "@endeavour/vue-library/interfaces";

const API_URL = `${useRuntimeConfig().public.imapiUrl}query/protected`;

const QueryService = {
  async getQuerySql(sessionId: string, queryRequest: QueryRequest): Promise<string> {
    return (await $fetch<string>(API_URL + "/sql", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    })) as any;
  },
  async queryIM(sessionId: string, query: QueryRequest): Promise<QueryResponse> {
    return await $fetch<QueryResponse>(API_URL + "/queryIM", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async flattenBooleans(sessionId: string, query: Query | Match): Promise<Query | Match> {
    return await $fetch<Query | Match>(API_URL + "/flattenBooleans", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async optimiseECLQuery(sessionId: string, query: Query): Promise<Query> {
    return await $fetch<Query>(API_URL + "/optimiseECLQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async queryIMSearch(sessionId: string, queryRequest: QueryRequest): Promise<SearchResponse> {
    return await $fetch<SearchResponse>(API_URL + "/queryIMSearch", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
  },

  async pathQuery(sessionId: string, pathQuery: PathQuery): Promise<{ match: Match[] }> {
    return await $fetch<{ match: Match[] }>(API_URL + "/pathQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: pathQuery,
      method: "POST"
    });
  },

  async askQuery(sessionId: string, query: QueryRequest): Promise<boolean> {
    return await $fetch<boolean>(API_URL + "/askQueryIM", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async getQueryDisplayFromQuery(sessionId: string, query: Query, displayMode: DisplayMode): Promise<Query> {
    return await $fetch<Query>(API_URL + "/queryDisplayFromQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { query: query, displayMode: displayMode },
      method: "POST"
    });
  },

  async getDisplayFromQueryIri(sessionId: string, iri: string, displayMode: DisplayMode): Promise<Query> {
    return await $fetch<Query>(API_URL + "/queryDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri, displayMode: displayMode },
      method: "GET"
    });
  },

  async getQueryFromIri(sessionId: string, iri: string): Promise<Query> {
    return await $fetch<Query>(API_URL + "/queryFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
  },

  async getDisplayFromIndicatorIri(sessionId: string, iri: string): Promise<Indicator> {
    return await $fetch<Indicator>(API_URL + "/indicatorDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
  },

  async expandCohort(sessionId: string, queryIri: string, cohortIri: string, displayMode: DisplayMode): Promise<Query> {
    return await $fetch<Query>(API_URL + "/expandCohort", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        queryIri: queryIri,
        cohortIri: cohortIri,
        displayMode: displayMode
      },
      method: "GET"
    });
  },

  async getDefaultQuery(sessionId: string): Promise<Query> {
    return await $fetch<Query>(API_URL + "/defaultQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      method: "GET"
    });
  },

  async generateQuerySQL(sessionId: string, queryIri: string, lang?: string): Promise<string> {
    return await $fetch<string>(API_URL + "/sql", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: queryIri, lang: lang },
      method: "GET"
    });
  },

  async generateQueryIML(sessionId: string, queryIri: string): Promise<IMLLanguage> {
    return await $fetch<IMLLanguage>(API_URL + "/imlFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: queryIri },
      method: "GET"
    });
  },

  async generateQuerySQLfromQuery(sessionId: string, queryRequest: QueryRequest): Promise<string> {
    return await $fetch<string>(API_URL + "/sql", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
  },

  async validateSelectionWithQuery(sessionId: string, selectedIri: string, queryRequest: QueryRequest): Promise<boolean> {
    const queryResponse = await this.queryIM(sessionId, queryRequest);
    return (
      isObjectHasKeys(queryResponse, ["entities"]) &&
      isArrayHasLength(queryResponse.entities) &&
      queryResponse.entities.some((entity: TTEntity) => entity.iri === selectedIri)
    );
  },

  async testRunQuery(sessionId: string, request: QueryRequest): Promise<string[]> {
    return $fetch<string[]>(API_URL + "/testRunQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: request,
      method: "POST"
    });
  },

  async findMissingArguments(sessionId: string, queryRequest: QueryRequest): Promise<ArgumentReference[]> {
    return $fetch<ArgumentReference[]>(API_URL + "/findRequestMissingArguments", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
  },

  async validateQuery(sessionId: string, query: Query): Promise<Query> {
    return await $fetch<Query>(API_URL + "/validateQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async getNestedReturns(sessionId: string, match: Match): Promise<Return[]> {
    return await $fetch<Return[]>(API_URL + "/nestedReturns", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { match: match },
      method: "POST"
    });
  },

  async getSubqueryIris(sessionId: string, queryIri: string, isIndicator: boolean = false): Promise<SubQueryDependency[]> {
    return await $fetch<SubQueryDependency[]>(`${useRuntimeConfig().public.imapiUrl}query/protected/subQueries`, {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        queryIri: queryIri,
        isIndicator: isIndicator
      },
      method: "get"
    });
  },

  async getQueryRequestForSQL(sessionId: string, queryRequest: QueryRequest): Promise<QueryRequest> {
    return await $fetch<QueryRequest>(`${useRuntimeConfig().public.imapiUrl}query/protected/queryRequestForSQL`, {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "post"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
