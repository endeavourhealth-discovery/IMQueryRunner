/**
 * nuxt-auth-utils (0.5.x) reassigns the handler's `config` to a merged copy of itself on every request, and the merge concatenates arrays, so
 * a handler created once adds the scopes to the authorize request again on each request ("openid profile email openid openid profile email
 * ..."), until Casdoor can no longer store the scope. Creating the handler per request gives it a fresh `config` every time.
 */
export default eventHandler(async event => {
  const result = await defineOAuthOidcEventHandler({
    async onSuccess(event, { user: claims, tokens }) {
      const { organisation } = useRuntimeConfig(event).casdoor;
      const name = claims.preferred_username;
      if (!name) throw createError({ statusCode: 401, statusMessage: "Login failed", message: "Identity provider returned no preferred_username" });

      const casdoorUser = await getCasdoorUser(organisation, name);
      await setUserSession(event, { user: { id: casdoorUser.id, owner: casdoorUser.owner, name: casdoorUser.name }, loggedInAt: new Date().toISOString() });
      // The tokens are used to call IMAPI as this user; they are too big for the cookie, so they are kept server-side against the session
      await saveTokens((await getUserSession(event)).id, tokens);

      const returnTo = getCookie(event, "auth_return") ?? "/";
      deleteCookie(event, "auth_return");
      return sendRedirect(event, returnTo);
    }
  })(event);

  // nuxt-auth-utils always marks its state/PKCE/nonce cookies Secure outside development, which a browser drops on a plain-http origin
  // (login then fails with "state mismatch"). NUXT_SESSION_COOKIE_SECURE=false opts out, for http-only deployments.
  if (useRuntimeConfig(event).session.cookie?.secure === false) {
    const setCookies = getResponseHeader(event, "set-cookie");
    if (setCookies) {
      const cookies = Array.isArray(setCookies) ? setCookies : [String(setCookies)];
      setResponseHeader(
        event,
        "set-cookie",
        cookies.map(c => c.replace(/;\s*Secure/i, ""))
      );
    }
  }

  return result;
});
