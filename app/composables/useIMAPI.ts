import type {QueryRequest, SearchResponse} from "~~/models/AutoGen";
import type { SubQueryDependency } from "~~/models/SubQueryDependency";
export function useIMAPI() {

  async function getQuerySql(queryRequest: QueryRequest): Promise<string> {
    return await $fetch(`/api/imapi/sql`, {
      body: queryRequest,
      method: "post",
    }) as any;
  }

  async function getSubqueryIris(
    queryIri: string,
  ): Promise<SubQueryDependency[]> {
    return await $fetch(`/api/imapi/subQueries`, {
      params: {
        queryIri: queryIri,
      },
      method: "get",
    }) as any;
  }

  async function getPartialEntity(iri: string, predicates: string[]) {
    return await $fetch(`/api/imapi/partial`, {
      params: {
        iri: iri,
        predicates: predicates.join(","),
      },
      method: "get",
    }) as any;
  }

  async function getEntityChildren(iri: string, filters?: any) {
    return await $fetch(`/api/imapi/children`, {
      params: {
        iri: iri,
        schemeIris: filters?.join(","),
      },
      method: "get",
    }) as any;
  }

  async function getQueryRequestForSQL(
    queryRequest: QueryRequest,
  ): Promise<QueryRequest> {
    return await $fetch(
      `/api/imapi/queryRequestForSQL`,
      {
        body: queryRequest,
        method: "post",
      },
    ) as any;
  }

  async function queryIMSearch(
    queryRequest: QueryRequest,
  ): Promise<SearchResponse> {
    return await $fetch(
      `/api/imapi/queryIMSearch`,
      {
        body: queryRequest,
        method: "post",
      },
    ) as any;
  }

  return {
    getQuerySql,
    getSubqueryIris,
    getPartialEntity,
    getEntityChildren,
    getQueryRequestForSQL,
    queryIMSearch
  }
}

