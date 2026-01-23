import type { DisplayMode, QueryRequest } from "~~/models/AutoGen";
import { $fetch } from "ofetch";

export class IMAPI {
  public async getQuerySql(queryRequest: QueryRequest): Promise<string> {
    return await $fetch(process.env.IMAPI_URL! + "query/private/sql", {
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

  public async describeQuery(queryIri: string, displayMode: DisplayMode) {
    return await $fetch(process.env.IMAPI_URL! + "query/private/queryDisplay", {
      params: {
        queryIri: queryIri,
        displayMode: displayMode,
      },
      method: "get",
    });
  }
}

export const imapi = new IMAPI();
