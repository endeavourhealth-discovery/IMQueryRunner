import StatusService from "~~/server/services/StatusService";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Is dev mode"
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  return await StatusService.isDevMode();
});
