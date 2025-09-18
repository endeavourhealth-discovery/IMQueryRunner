import { z } from "zod";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  console.log("API : logging-in");
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  if (token) {
    const response = await globalThis.casdoor.introspect(token, "access_token");
    if (response.data.active) {
      const casdoorUser = globalThis.casdoor.parseJwtToken(token);
      await clearUserSession(event);
      await setUserSession(event, {
        user: { name: casdoorUser.name, id: casdoorUser.id },
        loggedInAt: new Date(),
      });
      const { user } = await getUserSession(event);
      console.log("API : success logged in");
    } else {
      throw createError("Invalid token");
    }
  }
});
