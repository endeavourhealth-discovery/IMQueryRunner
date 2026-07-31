import type { ECLQueryRequest, PageableNode, Query, SetDiffObject, SetExportRequest, TTIriRef } from "@endeavour/vue-library/models";

const API_URL = +"api/imapi/set";

const SetService = {
  async publish(conceptIri: string): Promise<void> {
    return await $fetch<void>(API_URL + "/private/publish", {
      params: { iri: conceptIri },
      method: "GET"
    });
  },

  async getMembers(iri: string, entailments: boolean, pageIndex: number, pageSize: number, controller?: AbortController): Promise<PageableNode> {
    return await $fetch<PageableNode>(API_URL + "/members", {
      params: {
        iri: iri,
        entailments: entailments,
        page: pageIndex,
        size: pageSize
      },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getMembersFromQuery(query: Query, pageIndex: number, pageSize: number): Promise<PageableNode> {
    const request = {
      query: query,
      page: pageIndex,
      size: pageSize
    } as ECLQueryRequest;
    return await $fetch<PageableNode>(API_URL + "/membersFromQuery", {
      body: request,
      method: "POST"
    });
  },

  async getSubsets(iri: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/subsets", {
      params: {
        iri: iri
      },
      method: "GET"
    });
  },

  async getFullExportSet(setRequest: SetExportRequest, raw?: boolean): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/setExport", {
      body: setRequest,
      responseType: "blob",
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async getSetComparison(iriA?: string, iriB?: string): Promise<SetDiffObject> {
    return await $fetch<SetDiffObject>(API_URL + "/setDiff", {
      params: {
        setIriA: iriA,
        setIriB: iriB
      },
      method: "GET"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(SetService);

export default SetService;
