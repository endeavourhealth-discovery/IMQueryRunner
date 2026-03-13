import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get filter defaults",
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  return await EntityService.getFilterDefaultOptions();
});
