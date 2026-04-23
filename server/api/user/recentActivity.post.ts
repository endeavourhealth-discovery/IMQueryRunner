import { RecentActivityItemSchema } from "vue-library/models";

import * as z from "zod";

const bodySchema = z.array(RecentActivityItemSchema);

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
  const recentActivity = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.recentActivity = recentActivity;
  return await globalThis.apiGuard.updateUser(event, user);
});
