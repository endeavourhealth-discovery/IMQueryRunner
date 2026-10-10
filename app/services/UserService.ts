import type { UserPreferences } from "~~/models";

import type { PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";
import type { NamespacePermissionJava, RecentActivityItemDto, User } from "@endeavour/vue-library/models";

const API_URL = "api/user";

/** How long to wait for further changes before saving, so a burst of changes is one request. */
const SAVE_DELAY_MS = 300;

type Waiter = { resolve: (user: User) => void; reject: (reason: unknown) => void };

let pendingPreferences: UserPreferences = {};
let waiters: Waiter[] = [];
let saveTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Queues a preference change. Changes made within SAVE_DELAY_MS of each other (a theme change typically touches
 * several settings) are merged and saved with a single request; every caller gets the resulting user.
 */
function savePreferences(preferences: UserPreferences): Promise<User> {
  pendingPreferences = { ...pendingPreferences, ...preferences };
  return new Promise<User>((resolve, reject) => {
    waiters.push({ resolve, reject });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushPreferences, SAVE_DELAY_MS);
  });
}

async function flushPreferences(): Promise<void> {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (!waiters.length) return;

  const preferences = pendingPreferences;
  const batch = waiters;
  pendingPreferences = {};
  waiters = [];

  try {
    // keepalive lets the request finish even if the page is being closed
    const user = await $fetch<User>(API_URL + "/preferences", { body: preferences, method: "PATCH", keepalive: true });
    for (const waiter of batch) waiter.resolve(user);
  } catch (error) {
    for (const waiter of batch) waiter.reject(error);
  }
}

// Do not lose a change made just before the tab is hidden or closed
if (import.meta.client) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushPreferences();
  });
}

const UserService = {
  async updateUserPreset(preset: PrimeVuePresetThemes): Promise<User> {
    return savePreferences({ theme: preset });
  },
  async updateUserPrimaryColor(color: PrimeVueColors): Promise<User> {
    return savePreferences({ primaryColor: color });
  },
  async updateUserSurfaceColor(color: PrimeVueColors): Promise<User> {
    return savePreferences({ surfaceColor: color });
  },
  async updateUserDarkMode(bool: boolean): Promise<User> {
    return savePreferences({ darkMode: bool });
  },
  async updateUserFontSize(fontSize: string): Promise<User> {
    return savePreferences({ fontSize: fontSize as UserPreferences["fontSize"] });
  },
  async updateUserRecentActivity(recentActivity: RecentActivityItemDto[]): Promise<User> {
    // The dto marks fields optional that the schema requires; the server validates the real shape
    return savePreferences({ recentActivity: recentActivity as UserPreferences["recentActivity"] });
  },
  async updateUserFavourites(favourites: string[]): Promise<User> {
    return savePreferences({ favourites });
  },
  // Organisations and namespaces are not part of the user-editable preferences, so they keep their own endpoints
  async updateUserOrganisations(organisations: string[]): Promise<User> {
    return await $fetch<User>(API_URL + "/organisations", {
      body: organisations,
      method: "POST"
    });
  },
  async updateUserNamespaces(namespaces: NamespacePermissionJava[]): Promise<User> {
    return await $fetch<User>(API_URL + "/namespaces", {
      body: namespaces,
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(UserService);

export default UserService;
