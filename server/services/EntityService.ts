import { IM } from "vue-library/enums";
import type {
  DownloadByQueryOptions,
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
} from "vue-library/interfaces";
import type { OrganizationChartNode } from "primevue";

const EntityService = {
  // PUBLIC
  async getNamespaces(): Promise<Namespace[]> {
    return await $fetch<Namespace[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/public/namespaces`,
      {
        method: "get",
      },
    );
  },

  async getFilterOptions(): Promise<FilterOptions> {
    return await $fetch<FilterOptions>(
      `${useRuntimeConfig().public.imapiUrl}entity/public/filterOptions`,
      {
        method: "get",
      },
    );
  },

  async getFilterDefaultOptions(): Promise<FilterOptions> {
    return await $fetch<FilterOptions>(
      `${useRuntimeConfig().public.imapiUrl}entity/public/filterDefaults`,
      {
        method: "get",
      },
    );
  },

  // PROTECTED
  async getPartialEntity(
    sessionId: string,
    iri: string,
    predicates: string[],
  ): Promise<ExtendedTTEntity> {
    return await $fetch<ExtendedTTEntity>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/partial`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
          predicates: predicates.join(","),
        },
        method: "get",
      },
    );
  },

  async getPartialEntities(
    sessionId: string,
    typeIris: string[],
    predicates: string[],
  ): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/partials`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        body: {
          iris: [...new Set(typeIris)].join(","),
          predicates: [...new Set(predicates)].join(","),
        },
        method: "POST",
      },
    );
  },

  async getPartialEntityBundle(
    sessionId: string,
    iri: string,
    predicates: string[],
  ): Promise<TTBundle> {
    return await $fetch<TTBundle>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/partialBundle`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
          predicates: predicates.join(","),
        },
        method: "get",
      },
    );
  },

  async getEntityChildren(
    sessionId: string,
    iri: string,
    schemeIris?: string[],
    controller?: AbortController,
  ): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/children`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
          schemeIris: schemeIris,
        },
        signal: controller?.signal,
        method: "get",
      },
    );
  },

  async getEntityAsEntityReferenceNode(
    sessionId: string,
    iri: string,
  ): Promise<ExtendedEntityReferenceNode> {
    return await $fetch<ExtendedEntityReferenceNode>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/asEntityReferenceNode`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
        },
        method: "get",
      },
    );
  },

  async getAsEntityReferenceNodes(
    sessionId: string,
    iris: string[],
  ): Promise<ExtendedTTEntity> {
    return await $fetch<ExtendedTTEntity>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/asEntityReferenceNodes`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iris: iris.join(","),
        },
        method: "get",
      },
    );
  },

  async getPagedChildren(
    sessionId: string,
    iri: string,
    pageIndex: number,
    pageSize: number,
    schemes?: string[],
    controller?: AbortController,
    typeFilter?: string[],
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
    }>(`${useRuntimeConfig().public.imapiUrl}entity/protected/childrenPaged`, {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        page: pageIndex,
        size: pageSize,
        schemeIris: schemes?.join(","),
        typeFilter: typeFilter?.join(","),
      },
      signal: controller?.signal,
      method: "get",
    });
  },

  async getPartialAndTotalCount(
    sessionId: string,
    iri: string,
    predicate: string,
    pageIndex: number,
    pageSize: number,
    schemeIris?: string[],
    controller?: AbortController,
  ): Promise<Pageable<TTIriRef>> {
    return await $fetch<Pageable<TTIriRef>>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/partialAndTotalCount`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
          predicate: predicate,
          page: pageIndex,
          size: pageSize,
          schemeIris: schemeIris?.join(","),
        },
        signal: controller?.signal,
        method: "GET",
      },
    );
  },

  async downloadEntity(sessionId: string, iri: string): Promise<Blob> {
    return await $fetch<Blob>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/downloadEntity`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        responseType: "blob",
        method: "GET",
      },
    );
  },

  async getEntityParents(
    sessionId: string,
    iri: string,
    schemeIris?: string[],
  ): Promise<ExtendedEntityReferenceNode[]> {
    return await $fetch<ExtendedEntityReferenceNode[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/parents`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri, schemeIris: schemeIris?.join(",") },
        method: "GET",
      },
    );
  },

  async getEntityUsages(
    sessionId: string,
    iri: string,
    pageIndex: number,
    pageSize: number,
  ): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/usages`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
          page: pageIndex,
          size: pageSize,
        },
        method: "GET",
      },
    );
  },

  async getUsagesTotalRecords(sessionId: string, iri: string): Promise<number> {
    return await $fetch<number>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/usagesTotalRecords`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iri: iri,
        },
        method: "GET",
      },
    );
  },

  async entityExists(sessionId: string, iri: string): Promise<boolean> {
    return await $fetch<boolean>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/entityExists`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  async getEntitySummary(
    sessionId: string,
    iri: string,
  ): Promise<SearchResultSummary> {
    return await $fetch<SearchResultSummary>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/summary`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  async downloadSearchResults(
    sessionId: string,
    downloadSettings: DownloadByQueryOptions,
  ) {
    return await $fetch(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/downloadSearchResults`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        body: downloadSettings,
        responseType: "blob",
        raw: true,
        method: "POST",
      },
    );
  },

  async getFolderPath(sessionId: string, iri: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/folderPath`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  async getPathBetweenNodes(
    sessionId: string,
    descendant: string,
    ancestor: string,
  ): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/shortestParentHierarchy`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { descendant: descendant, ancestor: ancestor },
        method: "GET",
      },
    );
  },

  async getEntityByPredicateExclusions(
    sessionId: string,
    iri: string,
    predicates: string[],
  ): Promise<ExtendedTTEntity> {
    return await $fetch<ExtendedTTEntity>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/entityByPredicateExclusions`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri, predicates: predicates.join(",") },
        method: "GET",
      },
    );
  },

  async getBundleByPredicateExclusions(
    sessionId: string,
    iri: string,
    predicates: string[],
  ): Promise<TTBundle> {
    return await $fetch<TTBundle>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/bundleByPredicateExclusions`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri, predicates: predicates.join(",") },
        method: "GET",
      },
    );
  },

  async checkValidation(
    sessionId: string,
    validationIri: string,
    data: EntityValidationRequest,
  ): Promise<{ valid: boolean; message: string | undefined }> {
    return await $fetch<{ valid: boolean; message: string | undefined }>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/validate`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        body: { validationIri: validationIri, entity: data },
        method: "POST",
      },
    );
  },

  async getEntityGraph(
    sessionId: string,
    iri: string,
  ): Promise<OrganizationChartNode> {
    return await $fetch<OrganizationChartNode>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/graph`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  async getProvHistory(
    sessionId: string,
    iri: string,
  ): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/history`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  async getAllowableChildTypes(
    sessionId: string,
    iri: string,
  ): Promise<ExtendedTTEntity[]> {
    return await $fetch<ExtendedTTEntity[]>(
      `${useRuntimeConfig().public.imapiUrl}entity/protected/allowableChildTypes`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: { iri: iri },
        method: "GET",
      },
    );
  },

  // PRIVATE

  async getCoreSchemes(sessionId: string): Promise<string[]> {
    const coreSchemesChildren =
      (await this.getEntityChildren(sessionId, IM.ECL_BUILDER_SCHEMES)) ?? [];
    return coreSchemesChildren.map((child) => child.iri);
  },
};

export default EntityService;
