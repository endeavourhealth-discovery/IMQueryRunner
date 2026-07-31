import { ConceptContextMapSchema, SimpleMapSchema, TermCodeSchema, parseArray } from "@endeavour/vue-library";
import type { ConceptContextMap, SimpleMap, TermCode } from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}concept/protected`;

const ConceptService = {
  async getMatchedFrom(sessionId: string, iri: string): Promise<SimpleMap[]> {
    const result = await $fetch<SimpleMap[]>(API_URL + "/matchedFrom", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseArray(result, SimpleMapSchema);
  },

  async getMatchedTo(sessionId: string, iri: string): Promise<SimpleMap[]> {
    const result = await $fetch<SimpleMap[]>(API_URL + "/matchedTo", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseArray(result, SimpleMapSchema);
  },

  async getEntityTermCodes(sessionId: string, iri: string, includeInactive?: boolean): Promise<TermCode[]> {
    const result = await $fetch<TermCode[]>(API_URL + "/termCode", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri, includeInactive: includeInactive },
      method: "GET"
    });
    return parseArray(result, TermCodeSchema);
  },

  async getContextMaps(sessionId: string, conceptIri: string): Promise<ConceptContextMap[]> {
    const result = await $fetch<ConceptContextMap[]>(API_URL + "/conceptContextMaps", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      method: "GET"
    });
    return parseArray(result, ConceptContextMapSchema);
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(ConceptService);

export default ConceptService;
