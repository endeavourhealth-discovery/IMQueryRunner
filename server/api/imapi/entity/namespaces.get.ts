import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get namespaces"
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  return await EntityService.getNamespaces();
});
