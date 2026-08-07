import { DisplayMode } from "@endeavour/vue-library/enums";
import { isArrayHasLength, isObjectHasKeys, parseArray } from "@endeavour/vue-library/helpers";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type ArgumentReference,
  ArgumentReferenceSchema,
  type IMLLanguage,
  IMLLanguageSchema,
  type Indicator,
  IndicatorSchema,
  type PathDocument,
  PathDocumentSchema,
  type PathQuery,
  type Query,
  type QueryRequest,
  QueryRequestSchema,
  type QueryResponse,
  QueryResponseSchema,
  QuerySchema,
  type Return,
  ReturnSchema,
  type SearchResponse,
  SearchResponseSchema,
  type SubQueryDependency,
  SubQueryDependencySchema,
  type TTEntity,
  isQuery
} from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}query/protected`;

const QueryService = {
  async getQuerySql(sessionId: string, queryRequest: QueryRequest): Promise<string> {
    return (await $fetch<string>(API_URL + "/sql", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    })) as any;
  },

  async getQuerySqlDebug(sessionId: string, queryIri: string, patientId: string): Promise<string> {
    return await $fetch<string>(API_URL + "/sqlDebug", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri, patientId },
      method: "GET"
    });
  },
  async queryIM(sessionId: string, query: QueryRequest): Promise<QueryResponse> {
    const result = await $fetch(API_URL + "/queryIM", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return parseApiResponse(result, QueryResponseSchema);
  },

  async flattenBooleans(sessionId: string, query: Query): Promise<Query> {
    const result = await $fetch(API_URL + "/flattenBooleans", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async optimiseECLQuery(sessionId: string, query: Query): Promise<Query> {
    const result = await $fetch(API_URL + "/optimiseECLQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async queryIMSearch(sessionId: string, queryRequest: QueryRequest): Promise<SearchResponse> {
    const result = await $fetch(API_URL + "/queryIMSearch", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
    return parseApiResponse(result, SearchResponseSchema);
  },

  async pathQuery(sessionId: string, pathQuery: PathQuery): Promise<PathDocument> {
    const result = await $fetch(API_URL + "/pathQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: pathQuery,
      method: "POST"
    });
    return parseApiResponse(result, PathDocumentSchema);
  },

  async askQuery(sessionId: string, query: QueryRequest): Promise<boolean> {
    return await $fetch<boolean>(API_URL + "/askQueryIM", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
  },

  async getQueryDisplayFromQuery(sessionId: string, query: Query, displayMode: DisplayMode): Promise<Query> {
    const result = await $fetch(API_URL + "/queryDisplayFromQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { query: query, displayMode: displayMode },
      method: "POST"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getDisplayFromQueryIri(sessionId: string, iri: string, displayMode: DisplayMode): Promise<Query> {
    const result = await $fetch(API_URL + "/queryDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri, displayMode: displayMode },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getQueryFromIri(sessionId: string, iri: string): Promise<Query> {
    const result = await $fetch(API_URL + "/queryFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getDisplayFromIndicatorIri(sessionId: string, iri: string): Promise<Indicator> {
    const result = await $fetch<Indicator>(API_URL + "/indicatorDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return parseApiResponse(result, IndicatorSchema);
  },

  async expandCohort(sessionId: string, queryIri: string, cohortIri: string, displayMode: DisplayMode): Promise<Query> {
    const result = await $fetch(API_URL + "/expandCohort", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        queryIri: queryIri,
        cohortIri: cohortIri,
        displayMode: displayMode
      },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getDefaultQuery(sessionId: string): Promise<Query> {
    const result = await $fetch(API_URL + "/defaultQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async generateQuerySQL(sessionId: string, queryIri: string, lang?: string): Promise<string> {
    return await $fetch<string>(API_URL + "/sql", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: queryIri, lang: lang },
      method: "GET"
    });
  },

  async generateQueryIML(sessionId: string, queryIri: string): Promise<IMLLanguage> {
    const result = await $fetch(API_URL + "/imlFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: queryIri },
      method: "GET"
    });
    return parseApiResponse(result, IMLLanguageSchema);
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
    const result = $fetch(API_URL + "/findRequestMissingArguments", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
    return parseApiResponse(result, ArgumentReferenceSchema, true);
  },

  async validateQuery(sessionId: string, query: Query): Promise<Query> {
    const result = await $fetch(API_URL + "/validateQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getNestedReturns(sessionId: string, match: Query): Promise<Return[]> {
    const result = await $fetch(API_URL + "/nestedReturns", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { match: match },
      method: "POST"
    });
    return parseApiResponse(result, ReturnSchema, true);
  },

  async getSubqueryIris(sessionId: string, queryIri: string, isIndicator: boolean = false): Promise<SubQueryDependency[]> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/subQueries`, {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        queryIri: queryIri,
        isIndicator: isIndicator
      },
      method: "get"
    });
    return parseApiResponse(result, SubQueryDependencySchema, true);
  },

  async getQueryRequestForSQL(sessionId: string, queryRequest: QueryRequest): Promise<QueryRequest> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryRequestForSQL`, {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "post"
    });
    return parseApiResponse(result, QueryRequestSchema);
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
