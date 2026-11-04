import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type ExtendedEntityReferenceNode,
  ExtendedEntityReferenceNodeSchema,
  type PageableEntityReferenceNode,
  PageableEntityReferenceNodeSchema,
  type SearchResultSummary,
  SearchResultSummarySchema
} from "@endeavour/vue-library/models";

import z from "zod";

const EntityService = {
  // PROTECTED
  async getEntityChildren(accessToken: string, iri: string, schemeIris?: string[], controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/children`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        iri: iri,
        schemeIris: schemeIris
      },
      signal: controller?.signal,
      method: "get"
    });
    return parseApiResponse(result, z.array(ExtendedEntityReferenceNodeSchema));
  },

  async getEntitySummary(accessToken: string, iri: string): Promise<SearchResultSummary> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseApiResponse(result, SearchResultSummarySchema);
  },

  async getPagedChildren(accessToken: string, iri: string, page: number, size: number): Promise<PageableEntityReferenceNode> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/childrenPaged`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { iri, page, size },
      method: "GET"
    });
    return parseApiResponse(result, PageableEntityReferenceNodeSchema);
  }
};

export default EntityService;
