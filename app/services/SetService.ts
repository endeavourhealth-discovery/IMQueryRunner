import type { ECLQueryRequest, Node, Pageable, Query, SetDiffObject, SetExportRequest, TTEntity, TTIriRef } from "vue-library/interfaces";

const API_URL = +"api/imapi/set";

const SetService = {
  async publish(conceptIri: string): Promise<void> {
    return await $fetch<void>(API_URL + "/private/publish", {
      params: { iri: conceptIri },
      method: "GET"
    });
  },

  async IMV1(conceptIri: string, raw?: boolean): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/protected/export", {
      params: { iri: conceptIri },
      responseType: "blob",
      ignoreResponseError: raw,
      method: "GET"
    });
  },

  async getMembers(iri: string, entailments: boolean, pageIndex: number, pageSize: number, controller?: AbortController): Promise<Pageable<Node>> {
    return await $fetch<Pageable<Node>>(API_URL + "/protected/members", {
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

  async getMembersFromQuery(query: Query, pageIndex: number, pageSize: number): Promise<Pageable<Node>> {
    const request = {
      query: query,
      page: pageIndex,
      size: pageSize
    } as ECLQueryRequest;
    return await $fetch<Pageable<Node>>(API_URL + "/protected/membersFromQuery", {
      body: request,
      method: "POST"
    });
  },

  async getSubsets(iri: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/protected/subsets", {
      params: {
        iri: iri
      },
      method: "GET"
    });
  },

  async getFullExportSet(setRequest: SetExportRequest, raw?: boolean): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/protected/setExport", {
      body: setRequest,
      responseType: "blob",
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async getSetComparison(iriA?: string, iriB?: string): Promise<SetDiffObject> {
    return await $fetch<SetDiffObject>(API_URL + "/protected/setDiff", {
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
