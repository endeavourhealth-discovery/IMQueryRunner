import { z } from "~~/shared/zod";

const bodySchema = z.array(z.string()).openapi({
  description: "Favourites",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user favourites",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const favourites = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.favourites = favourites;
  return await globalThis.apiGuard.updateUser(event, user);
});
