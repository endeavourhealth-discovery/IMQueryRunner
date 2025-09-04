import {QueryRequest} from "~~/models/AutoGen";
import {$fetch} from "ofetch";

export class IMAPI {
  public async getQuerySql(queryRequest: QueryRequest) {
    return await $fetch(process.env.IMAPI_URL! + "query/public/sql", {
      body: queryRequest,
      method: "post",
    })
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
}

export const imapi = new IMAPI();