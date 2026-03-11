import type {
  Query,
  SearchResponse,
  ECLQueryRequest,
} from "vue-library/interfaces";

const API_URL = +"api/imapi/ecl";

const EclService = {
  async ECLSearch(
    eclSearchRequest: ECLQueryRequest,
    controller?: AbortController,
  ): Promise<SearchResponse> {
    const results: SearchResponse = await $fetch<SearchResponse>(
      API_URL + "/eclSearch",
      { body: eclSearchRequest, signal: controller?.signal, method: "POST" },
    );
    return results;
  },

  async getEcl(query: Query): Promise<string> {
    return await $fetch<string>(API_URL + "/ecl", {
      body: { query: query },
      method: "POST",
    });
  },

  async getQueryFromECL(
    ecl: string,
    raw: boolean = false,
  ): Promise<ECLQueryRequest> {
    return await $fetch(API_URL + "/queryFromEcl", {
      body: { ecl: ecl, status: { valid: true } },
      headers: { "Content-Type": "application/json" },
      raw: raw,
      method: "POST",
    });
  },

  async getEclFromEcl(
    ecl: string,
    showNames: boolean,
  ): Promise<ECLQueryRequest> {
    return await $fetch(API_URL + "/eclFromEcl", {
      body: { ecl: ecl, showNames: showNames, status: { valid: true } },
      headers: { "Content-Type": "application/json" },
      raw: true,
      method: "POST",
    });
  },

  async validateECL(ecl: string, showNames: boolean): Promise<ECLQueryRequest> {
    return await $fetch(API_URL + "/validateEcl", {
      body: { ecl: ecl, showNames: showNames, status: { valid: true } },
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  },

  async validateModelFromQuery(query: Query): Promise<ECLQueryRequest> {
    return await $fetch(API_URL + "/validateModelFromQuery", {
      body: { query: query, status: { valid: true } },
      headers: { "Content-Type": "application/json" },
      raw: true,
      method: "POST",
    });
  },

  async getRangesForProperty(
    propertyIri: string,
    controller?: AbortController,
  ): Promise<string[]> {
    return await $fetch(API_URL + "/rangesForProperty", {
      params: { propertyIri: propertyIri },
      signal: controller?.signal,
      method: "GET",
    });
  },

  async getECLFromQuery(
    query: Query,
    showNames?: boolean,
  ): Promise<ECLQueryRequest> {
    return await $fetch(API_URL + "/eclFromQuery", {
      body: { query: query, showNames: showNames },
      headers: { "Content-Type": "application/json" },
      raw: true,
      method: "POST",
    });
  },
};
export default EclService;
