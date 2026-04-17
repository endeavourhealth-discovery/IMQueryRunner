import type {
  TTIriRef,
  NodeShape,
  PropertyDisplay,
  UIProperty,
} from "vue-library/interfaces";
const API_URL = `${useRuntimeConfig().public.imapiUrl}dataModel/protected`;

const DataModelService = {
  async getDataModelProperties(
    sessionId: string,
    iri: string,
    pathsOnly?: boolean,
  ): Promise<NodeShape> {
    return await $fetch<NodeShape>(API_URL + "/dataModelProperties", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        iri: iri,
        ...(pathsOnly !== undefined && { pathsOnly: pathsOnly }),
      },
      method: "GET",
    });
  },
  async getDataModelPropertiesWithValueType(
    sessionId: string,
    iris: string[],
    valueType: string,
  ): Promise<NodeShape[]> {
    return await $fetch<NodeShape[]>(
      API_URL + "/dataModelPropertiesWithValueType",
      {
        headers: { cookie: `session_id=${sessionId}` },
        params: {
          iris: iris.join(","),
          valueType: valueType,
        },
        method: "GET",
      },
    );
  },
  async getDataModelsFromProperty(
    sessionId: string,
    propIri: string,
  ): Promise<TTIriRef[]> {
    return await $fetch<TTIriRef[]>(API_URL + "/dataModels", {
      headers: { cookie: `session_id=${sessionId}` },
      params: {
        propIri: propIri,
      },
      method: "GET",
    });
  },
  async checkPropertyType(sessionId: string, iri: string): Promise<string> {
    return await $fetch<string>(API_URL + "/checkPropertyType", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri },
      method: "GET",
    });
  },

  async getUIProperty(
    sessionId: string,
    dmIri: string,
    propIri: string,
  ): Promise<UIProperty> {
    return await $fetch<UIProperty>(API_URL + "/UIPropertyForQB", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { dmIri: dmIri, propIri: propIri },
      method: "GET",
    });
  },

  async getPropertiesDisplay(
    sessionId: string,
    iri: string,
  ): Promise<PropertyDisplay[]> {
    return await $fetch<PropertyDisplay[]>(API_URL + "/propertiesDisplay", {
      headers: { cookie: `session_id=${sessionId}` },
      params: { iri: iri },
      method: "GET",
    });
  },
};
if (process.env.NODE_ENV !== "test") Object.freeze(DataModelService);

export default DataModelService;
