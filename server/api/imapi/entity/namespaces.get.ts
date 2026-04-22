import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EntityService from "~~/server/services/EntityService";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get namespaces",
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  return await EntityService.getNamespaces();
});
