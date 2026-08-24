import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type Query,
  type QueryRequest,
  QueryRequestSchema,
  QuerySchema,
  type SearchResponse,
  SearchResponseSchema,
  type SubQueryDependency,
  SubQueryDependencySchema
} from "@endeavour/vue-library/models";

import z from "zod";

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

  async queryIMSearch(sessionId: string, queryRequest: QueryRequest): Promise<SearchResponse> {
    const result = await $fetch(API_URL + "/queryIMSearch", {
      headers: { cookie: `session_id=${sessionId}` },
      body: queryRequest,
      method: "POST"
    });
    return parseApiResponse(result, SearchResponseSchema);
  },

  async getQueryFromIri(sessionId: string, iri: string): Promise<Query> {
    const result = await $fetch(API_URL + "/queryFromIri", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
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
    return parseApiResponse(result, z.array(SubQueryDependencySchema));
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
