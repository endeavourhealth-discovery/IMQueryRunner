import { PropertyDisplaySchema, TTIriRefSchema, UIPropertySchema, parseArray } from "@endeavour/vue-library";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import { type NodeShape, NodeShapeSchema, type PropertyDisplay, type TTIriRef, type UIProperty } from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}dataModel/protected`;

const DataModelService = {
  async getDataModelProperties(sessionId: string, iri: string, pathsOnly?: boolean): Promise<NodeShape> {
    const result = await $fetch(API_URL + "/dataModelProperties", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        ...(pathsOnly !== undefined && { pathsOnly: pathsOnly })
      },
      method: "GET"
    });
    return parseApiResponse(result, NodeShapeSchema);
  },
  async getDataModelPropertiesWithValueType(sessionId: string, iris: string[], valueType: string): Promise<NodeShape[]> {
    const result = await $fetch(API_URL + "/dataModelPropertiesWithValueType", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iris: iris.join(","),
        valueType: valueType
      },
      method: "GET"
    });
    return parseApiResponse(result, NodeShapeSchema, true);
  },
  async getDataModelsFromProperty(sessionId: string, propIri: string): Promise<TTIriRef[]> {
    const result = await $fetch(API_URL + "/dataModels", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        propIri: propIri
      },
      method: "GET"
    });
    return parseApiResponse(result, TTIriRefSchema, true);
  },
  async checkPropertyType(sessionId: string, iri: string): Promise<string> {
    return await $fetch<string>(API_URL + "/checkPropertyType", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri },
      method: "GET"
    });
  },

  async getUIProperty(sessionId: string, dmIri: string, propIri: string): Promise<UIProperty> {
    const result = await $fetch(API_URL + "/UIPropertyForQB", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { dmIri: dmIri, propIri: propIri },
      method: "GET"
    });
    return parseApiResponse(result, UIPropertySchema);
  },

  async getPropertiesDisplay(sessionId: string, iri: string): Promise<PropertyDisplay[]> {
    const result = await $fetch(API_URL + "/propertiesDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri },
      method: "GET"
    });
    return parseApiResponse(result, PropertyDisplaySchema, true);
  }
};
if (process.env.NODE_ENV !== "test") Object.freeze(DataModelService);

export default DataModelService;
