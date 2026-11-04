import {
  type ExtendedEntityReferenceNode,
  type FiltersAsIris,
  type PageableEntityReferenceNode,
  type SearchResultSummary
} from "@endeavour/vue-library/models";

const API_URL = "api/imapi/entity";

const EntityService = {
  async getEntityChildren(iri: string, filters?: FiltersAsIris, controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/children", {
      params: { iri: iri, schemeIris: filters?.schemes.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getEntitySummary(iri: string, controller?: AbortController): Promise<SearchResultSummary> {
    return await $fetch<SearchResultSummary>(API_URL + "/summary", {
      params: { iri: iri },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getPagedChildren(iri: string, page: number, size: number, controller?: AbortController): Promise<PageableEntityReferenceNode> {
    return await $fetch<PageableEntityReferenceNode>(API_URL + "/childrenPaged", {
      params: { iri: iri, page: page, size: size },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getAsEntityReferenceNodes(iris: string[], controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/asEntityReferenceNodes", {
      params: { iris: iris.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(EntityService);

export default EntityService;
