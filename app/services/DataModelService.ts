import type { NodeShape, PropertyDisplay, TTIriRef, UIProperty } from "@endeavour/vue-library/interfaces";

const API_URL = "api/imapi/dataModel";

const DataModelService = {
  async getDataModelProperties(iri: string, pathsOnly?: boolean): Promise<NodeShape> {
    return await $fetch<NodeShape>(API_URL + "/dataModelProperties", {
      params: {
        iri: iri,
        ...(pathsOnly !== undefined && { pathsOnly: pathsOnly })
      },
      method: "GET"
    });
  },

  async getDataModelsFromProperty(propIri: string): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/dataModels", {
      params: {
        propIri: propIri
      },
      method: "GET"
    });
  },

  async getPropertiesDisplay(iri: string): Promise<PropertyDisplay[]> {
    return await $fetch<PropertyDisplay[]>(API_URL + "/propertiesDisplay", {
      params: { iri: iri },
      method: "GET"
    });
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(DataModelService);

export default DataModelService;
