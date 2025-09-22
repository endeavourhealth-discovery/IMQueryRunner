import type { Token } from "casdoor-nodejs-sdk/lib/cjs/token";
import type { H3Event, EventHandlerRequest } from "h3";
[];

export async function logout(event: H3Event<EventHandlerRequest>) {
  console.log("API : logging-out");
  const accessToken = getCookie(event, "casdoor_access_token");
  const refreshToken = getCookie(event, "casdoor_refresh_token");
  if (accessToken && refreshToken)
    await globalThis.casdoor.deleteToken({
      accessToken: accessToken,
      refreshToken: refreshToken,
    } as Token);
  deleteCookie(event, "casdoor_access_token");
  deleteCookie(event, "casdoor_refresh_token");
  deleteCookie(event, "casdoor_session_id");
  deleteCookie(event, "casdoor_user");
  console.log("API : successfully logged out");
}
