import type {
  ECLQueryRequest,
  Node,
  Pageable,
  Query,
  SetDiffObject,
  SetExportRequest,
  TTEntity,
  TTIriRef,
} from "vue-library/interfaces";
const API_URL = `${useRuntimeConfig().public.imapiUrl}set`;

const SetService = {
  async publish(sessionId: string, conceptIri: string): Promise<void> {
    return await $fetch(API_URL + "/private/publish", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      method: "GET",
    });
  },

  async IMV1(sessionId: string, conceptIri: string): Promise<Blob> {
    return await $fetch(API_URL + "/protected/export", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      responseType: "blob",
      method: "GET",
    });
  },
  async getMembers(
    sessionId: string,
    iri: string,
    entailments: boolean,
    pageIndex: number,
    pageSize: number,
  ): Promise<Pageable<Node>> {
    return await $fetch(API_URL + "/protected/members", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        entailments: entailments,
        page: pageIndex,
        size: pageSize,
      },
      method: "GET",
    });
  },

  async getMembersFromQuery(
    sessionId: string,
    query: Query,
    pageIndex: number,
    pageSize: number,
  ): Promise<Pageable<Node>> {
    const request = {
      query: query,
      page: pageIndex,
      size: pageSize,
    } as ECLQueryRequest;
    return await $fetch(API_URL + "/protected/membersFromQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: request,
      method: "POST",
    });
  },

  async getSubsets(sessionId: string, iri: string): Promise<TTIriRef[]> {
    return await $fetch(API_URL + "/protected/subsets", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
      },
      method: "GET",
    });
  },

  async getFullExportSet(
    sessionId: string,
    setRequest: SetExportRequest,
  ): Promise<Blob> {
    return await $fetch(API_URL + "/protected/setExport", {
      headers: { cookie: `session_id=${sessionId}` },
      body: setRequest,
      responseType: "blob",
      method: "POST",
    });
  },

  async getSetComparison(
    sessionId: string,
    iriA?: string,
    iriB?: string,
  ): Promise<SetDiffObject> {
    return await $fetch(API_URL + "/protected/setDiff", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        setIriA: iriA,
        setIriB: iriB,
      },
      method: "GET",
    });
  },

  async updateSubsetsFromSuper(sessionId: string, entity: TTEntity) {
    return await $fetch(API_URL + "/private/updateSubsetsFromSuper", {
      headers: { cookie: `session_id=${sessionId}` },
      body: entity,
      method: "POST",
    });
  },
};

if (process.env.NODE_ENV !== "test") Object.freeze(SetService);

export default SetService;
