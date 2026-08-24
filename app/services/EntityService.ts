import { type ExtendedEntityReferenceNode, type FiltersAsIris } from "@endeavour/vue-library/models";

const API_URL = "api/imapi/entity";

const EntityService = {
  async getEntityChildren(iri: string, filters?: FiltersAsIris, controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/children", {
      params: { iri: iri, schemeIris: filters?.schemes.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(EntityService);

export default EntityService;
