import type { H3Event, EventHandlerRequest } from "h3";

export function setAuthCookies(
  event: H3Event<EventHandlerRequest>,
  tokens: { access_token: string; refresh_token: string }
) {
  if (tokens) {
    const casdoorUser = globalThis.casdoor.parseJwtToken(tokens.access_token);
    setCookie(event, "casdoor_user", JSON.stringify(casdoorUser));
    setCookie(event, "casdoor_access_token", tokens.access_token);
    setCookie(event, "casdoor_refresh_token", tokens.refresh_token);
  }
}
