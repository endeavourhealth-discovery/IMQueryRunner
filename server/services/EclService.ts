import type { ECLQueryRequest, Query, SearchResponse } from "vue-library/interfaces";

const API_URL = `${useRuntimeConfig().public.imapiUrl}/ecl/protected`;

const EclService = {
  async ECLSearch(sessionId: string, eclSearchRequest: ECLQueryRequest): Promise<SearchResponse> {
    const results = await $fetch<SearchResponse>(API_URL + "/eclSearch", {
      headers: { cookie: `session_id=${sessionId}` },
      body: eclSearchRequest,
      method: "POST"
    });
    return results;
  },

  async getEcl(sessionId: string, query: Query): Promise<string> {
    return await $fetch<string>(API_URL + "/ecl", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { query: query },
      method: "POST"
    });
  },

  async getQueryFromECL(sessionId: string, ecl: string, raw: boolean = false): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/queryFromEcl", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "application/json"
      },
      body: { ecl: ecl, status: { valid: true } },
      ignoreResponseError: raw,
      method: "POST"
    });
  },

  async getEclFromEcl(sessionId: string, ecl: string, showNames: boolean): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/eclFromEcl", {
      body: { ecl: ecl, showNames: showNames, status: { valid: true } },
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${sessionId}`
      },
      ignoreResponseError: true,
      method: "POST"
    });
  },

  async validateECL(sessionId: string, ecl: string, showNames: boolean): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/validateEcl", {
      body: { ecl: ecl, showNames: showNames, status: { valid: true } },
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
  },

  async validateModelFromECL(sessionId: string, ecl: string, showNames: boolean): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/validateModelFromECL", {
      body: { ecl: ecl, showNames: showNames, status: { valid: true } },
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${sessionId}`
      },
      ignoreResponseError: true,
      method: "POST"
    });
  },

  async validateModelFromQuery(sessionId: string, query: Query): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/validateModelFromQuery", {
      body: { query: query, status: { valid: true } },
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${sessionId}`
      },
      ignoreResponseError: true,
      method: "POST"
    });
  },

  async getPropertiesForDomains(sessionId: string, conceptIri: string[], controller?: AbortController): Promise<string[]> {
    return await $fetch<string[]>(API_URL + "/propertiesForDomains", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { conceptIri: conceptIri.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async isValidPropertyForDomains(sessionId: string, propertyIri: string, conceptIri: string[], controller?: AbortController): Promise<string[]> {
    return await $fetch<string[]>(API_URL + "/isValidPropertyForDomains", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { propertyIri: propertyIri, conceptIri: conceptIri.join(",") },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getRangesForProperty(sessionId: string, propertyIri: string, controller?: AbortController): Promise<string[]> {
    return await $fetch<string[]>(API_URL + "/rangesForProperty", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { propertyIri: propertyIri },
      signal: controller?.signal,
      method: "GET"
    });
  },

  async getECLFromQuery(sessionId: string, query: Query, showNames?: boolean): Promise<ECLQueryRequest> {
    return await $fetch<ECLQueryRequest>(API_URL + "/eclFromQuery", {
      body: { query: query, showNames: showNames },
      headers: {
        "Content-Type": "application/json",
        cookie: `session_id=${sessionId}`
      },
      ignoreResponseError: true,
      method: "POST"
    });
  }
};
export default EclService;
