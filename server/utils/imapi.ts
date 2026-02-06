import type { DisplayMode, QueryRequest } from "~~/models/AutoGen";
import type { SubQueryDependency } from "~~/models/SubQueryDependency";
import { $fetch } from "ofetch";

export class IMAPI {
  public async getQuerySql(queryRequest: QueryRequest): Promise<string> {
    return await $fetch(process.env.IMAPI_URL! + "query/private/sql", {
      body: queryRequest,
      method: "post",
    });
  }

  public async getSubqueryIris(
    queryIri: String,
  ): Promise<SubQueryDependency[]> {
    return await $fetch(process.env.IMAPI_URL! + "query/private/subQueries", {
      params: {
        queryIri: queryIri,
      },
      method: "get",
    });
  }

  public async getPartialEntity(iri: string, predicates: string[]) {
    return await $fetch(process.env.IMAPI_URL! + "entity/public/partial", {
      params: {
        iri: iri,
        predicates: predicates.join(","),
      },
      method: "get",
    });
  }

  public async getQueryRequestForSQL(
    queryRequest: QueryRequest,
  ): Promise<QueryRequest> {
    return await $fetch(
      process.env.IMAPI_URL! + "query/private/queryRequestForSQL",
      {
        body: queryRequest,
        method: "post",
      },
    );
  }
}

export const imapi = new IMAPI();
