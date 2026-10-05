export default defineOAuthOidcEventHandler({
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
});
