import { useUserStore } from "@endeavour/vue-library/stores";

export function useAuth() {
  const { fetch: fetchSession, clear, session } = useUserSession();
  const userStore = useUserStore(usePinia());

  /** Loads the session and syncs the signed-in user into the user store. Returns false if nobody is signed in. */
  async function load(): Promise<boolean> {
    await fetchSession();
    const profile = session.value?.profile;
    if (!profile) return false;
    userStore.updateCurrentUser(profile);
    return true;
  }

  /** Sends the browser to the identity provider, returning to `redirect` (a same-origin path, default: the current page) afterwards. */
  async function login(redirect?: string): Promise<void> {
    const returnTo = redirect ?? (import.meta.client ? window.location.pathname + window.location.search : "/");
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(returnTo)}`, { external: true });
  }

  async function logout(): Promise<void> {
    await clear();
    userStore.updateCurrentUser(undefined);
    reloadNuxtApp();
  }

  async function profile(): Promise<void> {
    await navigateTo(`${useRuntimeConfig().public.casdoorUrl}/account`, { external: true });
  }

  return { load, login, logout, profile };
}
