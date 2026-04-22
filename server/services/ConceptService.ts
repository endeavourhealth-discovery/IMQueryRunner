import type { ConceptContextMap, SimpleMap, TermCode } from "vue-library/interfaces";

const API_URL = `${useRuntimeConfig().public.imapiUrl}concept/protected`;

const ConceptService = {
  async getMatchedFrom(sessionId: string, iri: string): Promise<SimpleMap[]> {
    return await $fetch<SimpleMap[]>(API_URL + "/matchedFrom", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
  },

  async getMatchedTo(sessionId: string, iri: string): Promise<SimpleMap[]> {
    return await $fetch<SimpleMap[]>(API_URL + "/matchedTo", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
  },

  async getEntityTermCodes(sessionId: string, iri: string, includeInactive?: boolean): Promise<TermCode[]> {
    return await $fetch<TermCode[]>(API_URL + "/termCode", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri, includeInactive: includeInactive },
      method: "GET"
    });
  },

  async getContextMaps(sessionId: string, conceptIri: string): Promise<ConceptContextMap[]> {
    return await $fetch<ConceptContextMap[]>(API_URL + "/conceptContextMaps", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      method: "GET"
    });
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(ConceptService);

export default ConceptService;
