import * as z from "zod";

const querySchema = z.object({ redirect: z.string().default("/") });

/** Only same-origin paths are allowed as a post-login destination (blocks open redirects). */
function safePath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
}

export default defineEventHandler(async event => {
  const { redirect } = await getValidatedQuery(event, querySchema.parse);
  setCookie(event, "auth_return", safePath(redirect), { httpOnly: true, sameSite: "lax", maxAge: 60 * 10 });
  return sendRedirect(event, "/auth/oidc");
});
