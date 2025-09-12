import { z } from "zod";

const paramSchema = z.object({
  code: z.string(),
});

export default defineEventHandler(async (event) => {
  console.log("API : logging-in");
  console.log(getHeaders(event));
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  const user = globalThis.casdoor.parseJwtToken(token);
  await clearUserSession(event);
  await setUserSession(event, {
    user: { name: user.name, id: user.id },
    secure: {
      casdoorAccessToken: token,
    },
  });
  const userSession = await getUserSession(event);
  console.log(userSession);
  console.log("API : success logged in");
  event.node.res.end();
});
