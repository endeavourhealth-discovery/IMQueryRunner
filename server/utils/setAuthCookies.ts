import type { H3Event, EventHandlerRequest } from "h3";

export function setAuthCookies(
  event: H3Event<EventHandlerRequest>,
  access_token: string,
  refresh_token?: string
) {
  const casdoorUser = globalThis.casdoor.parseJwtToken(access_token);
  setCookie(event, "casdoor_user", JSON.stringify(casdoorUser));
  setCookie(event, "casdoor_access_token", access_token);
  console.log("Access token set: ", access_token)

  if (refresh_token)
    setCookie(event, "casdoor_refresh_token", refresh_token);
  else
    deleteCookie(event, "casdoor_refresh_token");
}
