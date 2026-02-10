import type {QueryRequest, SearchResponse} from "~~/models/AutoGen";
import type { SubQueryDependency } from "~~/models/SubQueryDependency";
import { $fetch } from "ofetch";

export class IMAPI {

    public async getQuerySql(queryRequest: QueryRequest): Promise<string> {
        return await $fetch(`${useRuntimeConfig().public.imapiUrl!}query/private/sql`, {
            body: queryRequest,
            method: "post",
        });
    }

    public async getSubqueryIris(
        queryIri: String,
    ): Promise<SubQueryDependency[]> {
        return await $fetch(`${useRuntimeConfig().public.imapiUrl!}query/private/subQueries`, {
            params: {
                queryIri: queryIri,
            },
            method: "get",
        });
    }

    public async getPartialEntity(iri: string, predicates: string[]) {
        return await $fetch(`${useRuntimeConfig().public.imapiUrl!}entity/public/partial`, {
            params: {
                iri: iri,
                predicates: predicates.join(","),
            },
            method: "get",
        });
    }

    public async getEntityChildren(iri: string, filters?: any) {
        return await $fetch(`${useRuntimeConfig().public.imapiUrl!}entity/private/children`, {
            params: {
                iri: iri,
                schemeIris: filters?.join(","),
            },
            method: "get",
        });
    }

    public async getQueryRequestForSQL(
        queryRequest: QueryRequest,
    ): Promise<QueryRequest> {
        return await $fetch(
            `${useRuntimeConfig().public.imapiUrl!}query/private/queryRequestForSQL`,
            {
                body: queryRequest,
                method: "post",
            },
        );
    }

    public async queryIMSearch(
        queryRequest: QueryRequest,
    ): Promise<SearchResponse> {
        return await $fetch(
            `${useRuntimeConfig().public.imapiUrl!}query/private/queryIMSearch`,
            {
                body: queryRequest,
                method: "post",
            },
        );
    }
}

export const imapi = new IMAPI();
