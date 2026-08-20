import { IM } from "@endeavour/vue-library/enums";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import { type ExtendedEntityReferenceNode, ExtendedEntityReferenceNodeSchema } from "@endeavour/vue-library/models";

import type { OrganizationChartNode } from "primevue";
import z from "zod";

const EntityService = {
  // PROTECTED
  async getEntityChildren(sessionId: string, iri: string, schemeIris?: string[], controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    const result = await $fetch(`${useRuntimeConfig().public.imapiUrl}entity/protected/children`, {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        schemeIris: schemeIris
      },
      signal: controller?.signal,
      method: "get"
    });
    return parseApiResponse(result, z.array(ExtendedEntityReferenceNodeSchema));
  }
};

export default EntityService;
