import type { H3Event, EventHandlerRequest } from "h3";
import { getUser } from "./getUser";
import { setAuthCookies } from "./setAuthCookies";

export async function requireUser(event: H3Event<EventHandlerRequest>) {
  const token = getCookie(event, "casdoor_access_token");
  if (!token)
    throw createError({ status: 401, message: "Missing token cookie" });
  const response = await globalThis.casdoor.introspect(token, "access_token");
  if (!response.data.active)
    throw createError({ status: 401, message: "Invalid token" });
  else {
    const refresh = getCookie(event, "casdoor_refresh_token");
    if (refresh) {
      const refreshResponse = await globalThis.casdoor.introspect(
        token,
        "refresh_token"
      );
      if (!refreshResponse.data.active)
        throw createError({ status: 401, message: "Invalid refresh token" });
      const newTokens = await globalThis.casdoor.refreshToken(refresh);
      setAuthCookies(event, newTokens);
    }
  }
  const user = getUser(event);
  if (!user) throw createError({ status: 401, message: "User not found" });
}
