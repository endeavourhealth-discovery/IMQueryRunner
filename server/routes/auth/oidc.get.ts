export default defineOAuthOidcEventHandler({
  async onSuccess(event, { user: claims }) {
    const { organisation } = useRuntimeConfig(event).casdoor;
    const name = claims.preferred_username;
    if (!name) throw createError({ statusCode: 401, statusMessage: "Login failed", message: "Identity provider returned no preferred_username" });

    const casdoorUser = await getCasdoorUser(organisation, name);
    await setUserSession(event, { user: { id: casdoorUser.id, owner: casdoorUser.owner, name: casdoorUser.name }, loggedInAt: new Date().toISOString() });

    const returnTo = getCookie(event, "auth_return") ?? "/";
    deleteCookie(event, "auth_return");
    return sendRedirect(event, returnTo);
  }
});
