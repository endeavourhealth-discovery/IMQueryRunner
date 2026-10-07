import { IM } from "@endeavour/vue-library/enums";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import {
  type ExtendedEntityReferenceNode,
  ExtendedEntityReferenceNodeSchema,
  type SearchResultSummary,
  SearchResultSummarySchema
} from "@endeavour/vue-library/models";

import type { OrganizationChartNode } from "primevue";
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
  }
};

export default EntityService;
