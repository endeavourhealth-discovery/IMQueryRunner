import { ConceptContextMapSchema, SimpleMapSchema, TermCodeSchema, parseArray } from "@endeavour/vue-library";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import type { ConceptContextMap, SimpleMap, TermCode } from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}concept/protected`;

const ConceptService = {
  async getMatchedFrom(sessionId: string, iri: string): Promise<SimpleMap[]> {
    const result = await $fetch(API_URL + "/matchedFrom", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseApiResponse(result, SimpleMapSchema, true);
  },

  async getMatchedTo(sessionId: string, iri: string): Promise<SimpleMap[]> {
    const result = await $fetch(API_URL + "/matchedTo", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri
      },
      method: "GET"
    });
    return parseApiResponse(result, SimpleMapSchema, true);
  },

  async getEntityTermCodes(sessionId: string, iri: string, includeInactive?: boolean): Promise<TermCode[]> {
    const result = await $fetch(API_URL + "/termCode", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri, includeInactive: includeInactive },
      method: "GET"
    });
    return parseApiResponse(result, TermCodeSchema, true);
  },

  async getContextMaps(sessionId: string, conceptIri: string): Promise<ConceptContextMap[]> {
    const result = await $fetch(API_URL + "/conceptContextMaps", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: conceptIri },
      method: "GET"
    });
    return parseApiResponse(result, ConceptContextMapSchema, true);
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(ConceptService);

export default ConceptService;
