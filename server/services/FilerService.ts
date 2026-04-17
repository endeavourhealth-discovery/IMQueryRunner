import type { TTDocument, ExtendedTTEntity } from "vue-library/interfaces";
import { NAMESPACE } from "vue-library/enums";
const API_URL = `${useRuntimeConfig().public.imapiUrl}/filer/private`;

const FilerService = {
  async moveFolder(
    sessionId: string,
    entity: string,
    oldFolder: string,
    newFolder: string,
  ): Promise<void> {
    return await $fetch<void>(API_URL + "/folder/move", {
      headers: { cookie: `session_id=${sessionId}` },
      body: null,
      params: {
        entity,
        oldFolder,
        newFolder,
      },
      method: "POST",
    });
  },

  async addToFolder(
    sessionId: string,
    entity: string,
    folder: string,
  ): Promise<void> {
    return await $fetch<void>(API_URL + "/folder/add", {
      headers: { cookie: `session_id=${sessionId}` },
      body: null,
      params: {
        entity,
        folder,
      },
      method: "POST",
    });
  },

  async createFolder(
    sessionId: string,
    container: string,
    name: string,
  ): Promise<string> {
    return await $fetch<string>(API_URL + "/folder/create", {
      headers: { cookie: `session_id=${sessionId}` },
      body: null,
      params: {
        container: container,
        name: name,
      },
      method: "POST",
    });
  },

  async downloadDeltas(sessionId: string): Promise<Blob> {
    return await $fetch<Blob>(API_URL + "/deltas/download", {
      headers: { cookie: `session_id=${sessionId}` },
      responseType: "blob",
      method: "GET",
    });
  },

  async fileEntity(
    sessionId: string,
    entity: ExtendedTTEntity,
    namespace: NAMESPACE,
    crud: string,
  ): Promise<void> {
    return await $fetch<void>(API_URL + "/file/entity", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { entity: entity, namespace: namespace, crud: crud },
      method: "POST",
    });
  },

  async fileDocument(
    sessionId: string,
    document: TTDocument,
  ): Promise<{ [x: string]: string }> {
    return await $fetch<{ [x: string]: string }>(API_URL + "/file/document", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { document: document, insertNamespace: NAMESPACE.IM },
      method: "POST",
    });
  },

  async getTaskProgress(
    sessionId: string,
    taskId: string,
  ): Promise<{ [x: string]: number }> {
    return await $fetch<{ [x: string]: number }>(
      API_URL + `/file/document/${taskId}`,
      {
        headers: { cookie: `session_id=${sessionId}` },
        method: "GET",
      },
    );
  },
};

if (process.env.NODE_ENV !== "test") Object.freeze(FilerService);

export default FilerService;
