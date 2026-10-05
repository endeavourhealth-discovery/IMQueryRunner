import { fromCasdoorUser } from "../utils/casdoorUser";

export default defineNitroPlugin(() => {
  /** The sealed cookie only holds identity; hydrate the full user (roles, preferences) whenever the client fetches its session. */
  sessionHooks.hook("fetch", async session => {
    if (!session.user) return;
    session.profile = fromCasdoorUser(await getCasdoorUser(session.user.owner, session.user.name));
  });

  /** Signing out also discards the stored Casdoor tokens. */
  sessionHooks.hook("clear", async (_session, event) => {
    await deleteTokens((await getUserSession(event)).id);
  });
});
