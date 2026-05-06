import { IM, RDFS } from "@endeavour/vue-library/enums";
import type {
  DownloadByQueryOptions,
  EditRequest,
  EntityReferenceNode,
  EntityValidationRequest,
  ExtendedEntityReferenceNode,
  ExtendedTTEntity,
  FilterOptions,
  FiltersAsIris,
  Namespace,
  Pageable,
  SearchResultSummary,
  TTBundle,
  TTIriRef,
  ValidatedEntity
} from "@endeavour/vue-library/interfaces";

import { type OrganizationChartNode } from "primevue/organizationchart";
import type { TreeNode } from "primevue/treenode";

const API_URL = "api/imapi/entity";

const EntityService = {
  // ============================ PUBLIC ============================

  async getNamespaces(): Promise<Namespace[]> {
    return await $fetch<Namespace[]>(API_URL + "/namespaces", {
      method: "GET"
    });
  },

  async getFilterOptions(): Promise<FilterOptions> {
    return await $fetch<FilterOptions>(API_URL + "/filterOptions", {
      method: "GET"
    });
  },

  async getFilterDefaultOptions(): Promise<FilterOptions> {
    return await $fetch<FilterOptions>(API_URL + "/filterDefaults", {
      method: "GET"
    });
  },

  // ============================ PROTECTED ============================

  async getPartialEntity(iri: string, predicates: string[]): Promise<ExtendedTTEntity> {
    return await $fetch<ExtendedTTEntity>(API_URL + "/partial", {
      params: {
        iri: iri,
        predicates: predicates.join(",")
      },
      method: "GET"
    });
  },

  async getPartialEntities(typeIris: string[], predicates: string[]): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(API_URL + "/partials", {
      body: {
        iris: [...new Set(typeIris)].join(","),
        predicates: [...new Set(predicates)].join(",")
      },
      method: "POST"
    });
  },

  async getPartialEntityBundle(iri: string, predicates: string[]): Promise<TTBundle> {
    return await $fetch<TTBundle>(API_URL + "/partialBundle", {
      params: {
        iri: iri,
        predicates: predicates.join(",")
      },
      method: "GET"
    });
  },

  async getEntityChildren(iri: string, filters?: FiltersAsIris, controller?: AbortController): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/children", {
      params: { iri: iri, schemeIris: filters?.schemes.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getEntityAsEntityReferenceNode(iri: string): Promise<ExtendedEntityReferenceNode> {
    return await $fetch<ExtendedEntityReferenceNode>(API_URL + "/asEntityReferenceNode", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async getAsEntityReferenceNodes(iris: string[]): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/asEntityReferenceNodes", {
      params: { iris: iris.join(",") },
      method: "GET"
    });
  },

  async getPagedChildren(
    iri: string,
    pageIndex: number,
    pageSize: number,
    filters?: FiltersAsIris,
    controller?: AbortController,
    typeFilter?: string[]
  ): Promise<{
    totalCount: number;
    currentPage: number;
    pageSize: number;
    result: ExtendedTTEntity[];
  }> {
    return await $fetch<{
      totalCount: number;
      currentPage: number;
      pageSize: number;
      result: ExtendedTTEntity[];
    }>(API_URL + "/childrenPaged", {
      params: {
        iri: iri,
        page: pageIndex,
        size: pageSize,
        schemeIris: filters?.schemes.join(","),
        typeFilter: typeFilter?.join(",")
      },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getPartialAndTotalCount(
    iri: string,
    predicate: string,
    pageIndex: number,
    pageSize: number,
    filters?: FiltersAsIris,
    controller?: AbortController
  ): Promise<Pageable<TTIriRef>> {
    return await $fetch<Pageable<TTIriRef>>(API_URL + "/partialAndTotalCount", {
      params: {
        iri: iri,
        predicate: predicate,
        page: pageIndex,
        size: pageSize,
        schemeIris: filters?.schemes.join(",")
      },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async downloadEntity(iri: string): Promise<Blob> {
    return await useApi<Blob>(API_URL + "/downloadEntity", {
      params: { iri: iri },
      responseType: "blob",
      raw: true,
      method: "GET"
    });
  },

  async getEntityParents(iri: string, filters?: FiltersAsIris): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(API_URL + "/parents", {
      params: { iri: iri, schemeIris: filters?.schemes.join(",") },
      method: "GET"
    });
  },

  async getEntityUsages(iri: string, pageIndex: number, pageSize: number): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(API_URL + "/usages", {
      params: {
        iri: iri,
        page: pageIndex,
        size: pageSize
      },
      method: "GET"
    });
  },

  async getUsagesTotalRecords(iri: string): Promise<number> {
    return await $fetch<number>(API_URL + "/usagesTotalRecords", {
      params: {
        iri: iri
      },
      method: "GET"
    });
  },

  async entityExists(iri: string): Promise<boolean> {
    return await $fetch<boolean>(API_URL + "/entityExists", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async getEntitySummary(iri: string): Promise<SearchResultSummary> {
    return await $fetch<SearchResultSummary>(API_URL + "/summary", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async downloadSearchResults(downloadSettings: DownloadByQueryOptions): Promise<Blob> {
    return await useApi<Blob>(API_URL + "/downloadSearchResults", {
      body: downloadSettings,
      responseType: "blob",
      raw: true,
      method: "POST"
    });
  },

  async getFolderPath(iri: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/folderPath", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async getPathBetweenNodes(descendant: string, ancestor: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/shortestParentHierarchy", {
      params: { descendant: descendant, ancestor: ancestor },
      method: "GET"
    });
  },

  async getEntityByPredicateExclusions(iri: string, predicates: string[]): Promise<ExtendedTTEntity> {
    return await $fetch<ExtendedTTEntity>(API_URL + "/entityByPredicateExclusions", {
      params: { iri: iri, predicates: predicates.join(",") },
      method: "GET"
    });
  },

  async getBundleByPredicateExclusions(iri: string, predicates: string[], graph?: string): Promise<TTBundle> {
    return await $fetch<TTBundle>(API_URL + "/bundleByPredicateExclusions", {
      params: { iri: iri, predicates: predicates.join(","), graph: graph },
      method: "GET"
    });
  },

  async getEntityDetailsDisplay(iri: string): Promise<TreeNode[]> {
    return await $fetch<TreeNode[]>(API_URL + "/detailsDisplay", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async loadMoreDetailsDisplay(iri: string, predicate: string, pageIndex: number, pageSize: number): Promise<TreeNode[]> {
    return await $fetch<TreeNode[]>(API_URL + "/detailsDisplayLoadMore", {
      params: {
        iri: iri,
        predicate: predicate,
        pageIndex: pageIndex,
        pageSize: pageSize
      },
      method: "GET"
    });
  },

  async checkValidation(validationIri: string, data: EntityValidationRequest): Promise<{ valid: boolean; message: string | undefined }> {
    return await $fetch<{ valid: boolean; message: string | undefined }>(API_URL + "/validate", {
      body: { validationIri: validationIri, entity: data },
      method: "POST"
    });
  },

  async getEntityGraph(iri: string): Promise<OrganizationChartNode> {
    return await $fetch<OrganizationChartNode>(API_URL + "/graph", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async getProvHistory(iri: string): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(API_URL + "/history", {
      params: { iri: iri },
      method: "GET"
    });
  },

  async getAllowableChildTypes(iri: string): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(API_URL + "/allowableChildTypes", {
      params: { iri: iri },
      method: "GET"
    });
  },

  // ========================== PRIVATE ==========================

  // ========================== HELPERS ==========================

  async getCoreSchemes(): Promise<string[]> {
    const coreSchemesChildren = (await this.getEntityChildren(IM.ECL_BUILDER_SCHEMES)) ?? [];
    return coreSchemesChildren.map(child => child.iri);
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(EntityService);

export default EntityService;
