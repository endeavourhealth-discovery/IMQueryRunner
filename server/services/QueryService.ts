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
  async getQuerySql(accessToken: string, queryRequest: QueryRequest): Promise<string> {
    return (await $fetch<string>(API_URL + "/sql", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: queryRequest,
      method: "POST"
    })) as any;
  },

  async getQuerySqlDebug(accessToken: string, queryIri: string, patientId: string): Promise<string> {
    return await $fetch<string>(API_URL + "/sqlDebug", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { queryIri, patientId },
      method: "GET"
    });
  },

  async queryIMSearch(accessToken: string, queryRequest: QueryRequest): Promise<SearchResponse> {
    const result = await $fetch(API_URL + "/queryIMSearch", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: queryRequest,
      method: "POST"
    });
    return parseApiResponse(result, SearchResponseSchema);
  },

  async getQueryFromIri(accessToken: string, iri: string): Promise<Query> {
    const result = await $fetch(API_URL + "/queryFromIri", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { queryIri: iri },
      method: "GET"
    });
    return parseApiResponse(result, QuerySchema);
  },

  async getSubqueryIris(accessToken: string, queryIri: string, isIndicator: boolean = false): Promise<SubQueryDependency[]> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/subQueries`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        queryIri: queryIri,
        isIndicator: isIndicator
      },
      method: "get"
    });
    return parseApiResponse(result, z.array(SubQueryDependencySchema));
  },

  async getQueryRequestForSQL(accessToken: string, queryRequest: QueryRequest): Promise<QueryRequest> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryRequestForSQL`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: queryRequest,
      method: "post"
    });
    return parseApiResponse(result, QueryRequestSchema);
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(QueryService);

export default QueryService;
