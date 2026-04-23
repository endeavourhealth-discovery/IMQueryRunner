import { NAMESPACE } from "vue-library/enums";
import type { ExtendedTTEntity, TTDocument } from "vue-library/interfaces";

const API_URL = "api/imapi/filer";

const FilerService = {
  async moveFolder(entity: string, oldFolder: string, newFolder: string): Promise<void> {
    return await $fetch<void>(API_URL + "/folder/move", {
      params: {
        entity,
        oldFolder,
        newFolder
      },
      method: "POST"
    });
  },

  async addToFolder(entity: string, folder: string): Promise<void> {
    return await $fetch<void>(API_URL + "/folder/add", {
      params: {
        entity,
        folder
      },
      method: "POST"
    });
  },

  async createFolder(container: string, name: string): Promise<string> {
    return await $fetch<string>(API_URL + "/folder/create", {
      params: {
        container: container,
        name: name
      },
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(FilerService);

export default FilerService;
