import type {
  SimpleMap,
  TermCode,
  ConceptContextMap,
} from "vue-library/interfaces";
const API_URL = "api/imapi/concept";

const ConceptService = {
  async getMatchedFrom(iri: string): Promise<SimpleMap[]> {
    return await $fetch<SimpleMap[]>(API_URL + "/matchedFrom", {
      params: {
        iri: iri,
      },
      method: "GET",
    });
  },

  async getMatchedTo(iri: string): Promise<SimpleMap[]> {
    return await $fetch<SimpleMap[]>(API_URL + "/matchedTo", {
      params: {
        iri: iri,
      },
      method: "GET",
    });
  },

  async getEntityTermCodes(
    iri: string,
    includeInactive?: boolean,
  ): Promise<TermCode[]> {
    return await $fetch<TermCode[]>(API_URL + "/termCode", {
      params: { iri: iri, includeInactive: includeInactive },
      method: "GET",
    });
  },

  async getContextMaps(conceptIri: string): Promise<ConceptContextMap[]> {
    return await $fetch<ConceptContextMap[]>(API_URL + "/conceptContextMaps", {
      params: { iri: conceptIri },
      method: "GET",
    });
  },
};
if (process.env.NODE_ENV !== "test") Object.freeze(ConceptService);

export default ConceptService;
