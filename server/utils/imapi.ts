import type { QueryRequest } from "~~/models/AutoGen";
import type { SubQueryDependency } from "~~/models/SubQueryDependency";
import { $fetch } from "ofetch";

export class IMAPI {
  public async getQuerySql(queryRequest: QueryRequest): Promise<string> {
    return await $fetch(process.env.IMAPI_URL! + "query/public/sql", {
      body: queryRequest,
      method: "post",
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

  public async getSubQueries(queryIri: string): Promise<SubQueryDependency[]> {
    return await $fetch(process.env.IMAPI_URL! + "query/public/queryDisplay", {
      params: {
        queryIri: queryIri,
      },
      method: "get",
    });
  }

  public async getQueryRequestForSQL(
    queryRequest: QueryRequest
  ): Promise<QueryRequest> {
    return await $fetch(
      process.env.IMAPI_URL! + "query/public/queryRequestForSQL",
      {
        body: queryRequest,
        method: "post",
      }
    );
  }
}

export const imapi = new IMAPI();
