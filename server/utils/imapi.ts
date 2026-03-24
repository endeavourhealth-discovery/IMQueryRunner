import type {ArgumentReference, Query, QueryRequest, SearchResponse} from "~~/models/AutoGen";
import type {SubQueryDependency} from "~~/models/SubQueryDependency";

export class IMAPI {

  public async getQuerySql(sessionId: string, queryRequest: QueryRequest): Promise<string> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/sql`, {
      headers: {cookie: `session_id=${sessionId}`},
      body: queryRequest,
      method: "post",
    }) as any;
  }

  public async getSubqueryIris(sessionId: string,
                               queryIri: string,
  ): Promise<SubQueryDependency[]> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/subQueries`, {
      headers: {cookie: `session_id=${sessionId}`},
      params: {
        queryIri: queryIri,
      },
      method: "get",
    }) as any;
  }

  public async getPartialEntity(sessionId: string, iri: string, predicates: string[]) {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/partial`, {
      headers: {cookie: `session_id=${sessionId}`},
      params: {
        iri: iri,
        predicates: predicates.join(","),
      },
      method: "get",
    }) as any;

  }

  public async getEntityChildren(sessionId: string, iri: string, schemeIris?: any) {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/children`, {
      headers: {cookie: `session_id=${sessionId}`},
      params: {
        iri: iri,
        schemeIris: schemeIris ? schemeIris.join(",") : null,
      },
      method: "get",
    }) as any;
  }

  public async getQueryRequestForSQL(sessionId: string,
                                     queryRequest: QueryRequest,
  ): Promise<QueryRequest> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryRequestForSQL`, {
      headers: {cookie: `session_id=${sessionId}`},
      body: queryRequest,
      method: "post",
    }) as any;
  }

  public async queryIMSearch(sessionId: string,
                             queryRequest: QueryRequest,
  ): Promise<SearchResponse> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryIMSearch`, {
      headers: {cookie: `session_id=${sessionId}`},
      body: queryRequest,
      method: "post",
    }) as any;
  }

  public async findRequestMissingArguments(sessionId: string, ip: string, queryRequest: QueryRequest): Promise<ArgumentReference[]> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/findRequestMissingArguments`, {
      headers: {cookie: `session_id=${sessionId}`, "x-forwarded-for": ip},
      body: queryRequest,
      method: "post",
    }) as any;
  }

  public async getQueryFromIri(sessionId: string, queryIri: string): Promise<Query> {
    return await $fetch(`${useRuntimeConfig().public.imapiUrl}query/protected/queryFromIri`, {
      headers: {cookie: `session_id=${sessionId}`},
      params: {
        queryIri: queryIri,
      },
      method: "get",
    }) as any;
  }
}


export const imapi = new IMAPI();
