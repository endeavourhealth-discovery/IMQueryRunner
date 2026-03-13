import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import FilerService from "~~/server/services/FilerService";

const paramSchema = z.object({
  taskId: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get task progress",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "taskId", description: "Id of the task", in: "path" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { taskId } = await getQueryParams(event, paramSchema.parse);
  return await FilerService.getTaskProgress(sessionId, taskId);
});
