import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type ExtendedEntityReferenceNode,
  ExtendedEntityReferenceNodeSchema,
  type PageableEntityReferenceNode,
  PageableEntityReferenceNodeSchema,
  SearchResultSummarySchema
} from "@endeavour/vue-library/models";

import z from "zod";

const EntitySummarySchema = SearchResultSummarySchema.partial({ status: true, scheme: true, type: true });
export type EntitySummary = z.output<typeof EntitySummarySchema>;

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

  async getEntitySummary(accessToken: string, iri: string): Promise<EntitySummary> {
    const result = await $fetch<Record<string, unknown> | undefined>(`${useRuntimeConfig().public.imapiUrl}entity/protected/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    // IMAPI returns {} for entities it holds no summary for (e.g. QOF clauses); report just the IRI rather than failing validation
    if (!result || !Object.keys(result).length) return { iri } as EntitySummary;
    return parseApiResponse(result, EntitySummarySchema);
  },

  async getPagedChildren(accessToken: string, iri: string, page: number, size: number): Promise<PageableEntityReferenceNode> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/childrenPaged`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { iri, page, size },
      method: "GET"
    });
    return parseApiResponse(result, PageableEntityReferenceNodeSchema);
  },

  async getAsEntityReferenceNodes(accessToken: string, iris: string[]): Promise<ExtendedEntityReferenceNode[]> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/asEntityReferenceNodes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { iris: iris.join(",") },
      method: "GET"
    });
    return parseApiResponse(result, z.array(ExtendedEntityReferenceNodeSchema));
  }
};

export default EntityService;
