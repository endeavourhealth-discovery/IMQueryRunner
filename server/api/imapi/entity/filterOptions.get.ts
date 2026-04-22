import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EntityService from "~~/server/services/EntityService";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get filter options",
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  return await EntityService.getFilterOptions();
});
