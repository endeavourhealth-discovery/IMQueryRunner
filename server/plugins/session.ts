import { fromCasdoorUser } from "../utils/casdoorUser";

/** The sealed cookie only holds identity; hydrate the full user (roles, preferences) whenever the client fetches its session. */
export default defineNitroPlugin(() => {
  sessionHooks.hook("fetch", async session => {
    if (!session.user) return;
    session.profile = fromCasdoorUser(await getCasdoorUser(session.user.owner, session.user.name));
  });
});
