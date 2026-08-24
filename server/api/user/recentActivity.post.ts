import { parseArray } from "@endeavour/vue-library/helpers";
import { RecentActivityItemSchema } from "@endeavour/vue-library/models";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user preset theme",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              type: "string",
              description: "Recent activity items",
              enum: Object.values(RecentActivityItemSchema)
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event);
  const recentActivity = parseArray(body, RecentActivityItemSchema);
  const user = await globalThis.apiGuard.getUser(event);
  user.recentActivity = recentActivity;
  return await globalThis.apiGuard.updateUser(event, user);
});
