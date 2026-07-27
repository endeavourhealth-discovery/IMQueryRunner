import { DisplayMode } from "@endeavour/vue-library/enums";
import { isArrayHasLength, isObjectHasKeys, parseArray } from "@endeavour/vue-library/helpers";
import {
  type ArgumentReference,
  ArgumentReferenceSchema,
  type IMLLanguage,
  IMLLanguageSchema,
  type Indicator,
  IndicatorSchema,
  type Match,
  MatchSchema,
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
  isMatch,
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
  async queryIM(sessionId: string, query: QueryRequest): Promise<QueryResponse> {
    const result = await $fetch(API_URL + "/queryIM", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return QueryResponseSchema.parse(result);
  },

  async flattenBooleans(sessionId: string, query: Query | Match): Promise<Query | Match> {
    const result = await $fetch(API_URL + "/flattenBooleans", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    if (isQuery(result)) return QuerySchema.parse(result);
    if (isMatch(result)) return MatchSchema.parse(result);
    else throw new Error("Must be Match or Query");
  },

  async optimiseECLQuery(sessionId: string, query: Query): Promise<Query> {
    const result = await $fetch(API_URL + "/optimiseECLQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return QuerySchema.parse(result);
  },

  async queryIMSearch(sessionId: string, queryRequest: QueryRequest): Promise<SearchResponse> {
    const result = await $fetch(API_URL + "/queryIMSearch", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
    return SearchResponseSchema.parse(result);
  },

  async pathQuery(sessionId: string, pathQuery: PathQuery): Promise<PathDocument> {
    const result = await $fetch(API_URL + "/pathQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: pathQuery,
      method: "POST"
    });
    return PathDocumentSchema.parse(result);
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
    return QuerySchema.parse(result);
  },

  async getDisplayFromQueryIri(sessionId: string, iri: string, displayMode: DisplayMode): Promise<Query> {
    const result = await $fetch(API_URL + "/queryDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri, displayMode: displayMode },
      method: "GET"
    });
    return QuerySchema.parse(result);
  },

  async getQueryFromIri(sessionId: string, iri: string): Promise<Query> {
    const result = await $fetch(API_URL + "/queryFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return QuerySchema.parse(result);
  },

  async getDisplayFromIndicatorIri(sessionId: string, iri: string): Promise<Indicator> {
    const result = await $fetch<Indicator>(API_URL + "/indicatorDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return IndicatorSchema.parse(result);
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
    return QuerySchema.parse(result);
  },

  async getDefaultQuery(sessionId: string): Promise<Query> {
    const result = await $fetch(API_URL + "/defaultQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      method: "GET"
    });
    return QuerySchema.parse(result);
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
    return IMLLanguageSchema.parse(result);
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
    return parseArray(result, ArgumentReferenceSchema);
  },

  async validateQuery(sessionId: string, query: Query): Promise<Query> {
    const result = await $fetch(API_URL + "/validateQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: query,
      method: "POST"
    });
    return QuerySchema.parse(result);
  },

  async getNestedReturns(sessionId: string, match: Match): Promise<Return[]> {
    const result = await $fetch(API_URL + "/nestedReturns", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { match: match },
      method: "POST"
    });
    return parseArray(result, ReturnSchema);
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
    return parseArray(result, SubQueryDependencySchema);
  },

  async getQueryRequestForSQL(sessionId: string, queryRequest: QueryRequest): Promise<QueryRequest> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryRequestForSQL`, {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "post"
    });
    return QueryRequestSchema.parse(result);
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
