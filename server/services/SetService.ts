import { SetDiffObjectSchema, TTIriRefSchema, parseArray } from "@endeavour/vue-library";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type ECLQueryRequest,
  type Node,
  type Pageable,
  type PageableNode,
  PageableNodeSchema,
  type Query,
  type SetDiffObject,
  type SetExportRequest,
  type TTEntity,
  type TTIriRef
} from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}set`;

const SetService = {
  async publish(sessionId: string, conceptIri: string): Promise<void> {
    return await $fetch<void>(API_URL + "/private/publish", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      method: "GET"
    });
  },

  async IMV1(sessionId: string, conceptIri: string): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/protected/export", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      responseType: "blob",
      method: "GET"
    });
  },
  async getMembers(sessionId: string, iri: string, entailments: boolean, pageIndex: number, pageSize: number): Promise<PageableNode> {
    const result = await $fetch(API_URL + "/protected/members", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        entailments: entailments,
        page: pageIndex,
        size: pageSize
      },
      method: "GET"
    });
    return parseApiResponse(result, PageableNodeSchema);
  },

  async getMembersFromQuery(sessionId: string, query: Query, pageIndex: number, pageSize: number): Promise<PageableNode> {
    const request = {
      query: query,
      page: pageIndex,
      size: pageSize
    } as ECLQueryRequest;
    const result = await $fetch(API_URL + "/protected/membersFromQuery", {
      headers: { cookie: `session_id=${sessionId}` },
      body: request,
      method: "POST"
    });
    return parseApiResponse(result, PageableNodeSchema);
  },

  async getSubsets(sessionId: string, iri: string): Promise<TTIriRef[]> {
    const result = await $fetch<TTIriRef[]>(API_URL + "/protected/subsets", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseApiResponse(result, TTIriRefSchema, true);
  },

  async getFullExportSet(sessionId: string, setRequest: SetExportRequest): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/protected/setExport", {
      headers: { cookie: `session_id=${sessionId}` },
      body: setRequest,
      responseType: "blob",
      method: "POST"
    });
  },

  async getSetComparison(sessionId: string, iriA?: string, iriB?: string): Promise<SetDiffObject> {
    const result = await $fetch(API_URL + "/protected/setDiff", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        setIriA: iriA,
        setIriB: iriB
      },
      method: "GET"
    });
    return parseApiResponse(result, SetDiffObjectSchema);
  },

  async updateSubsetsFromSuper(sessionId: string, entity: TTEntity): Promise<void> {
    return await $fetch<void>(API_URL + "/private/updateSubsetsFromSuper", {
      headers: { cookie: `session_id=${sessionId}` },
      body: entity,
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(SetService);

export default SetService;
