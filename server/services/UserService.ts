import { PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";
import type { NamespacePermissionJava, RecentActivityItemDto } from "@endeavour/vue-library/models";
import { User } from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}user/private`;

const UserService = {
  async updateUserPreset(sessionId: string, preset: PrimeVuePresetThemes): Promise<User> {
    return await $fetch<User>(API_URL + "/preset", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      body: preset,
      method: "POST"
    });
  },

  async updateUserPrimaryColor(sessionId: string, color: PrimeVueColors): Promise<User> {
    return await $fetch<User>(API_URL + "/primaryColor", {
      body: color,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
  },

  async updateUserSurfaceColor(sessionId: string, color: PrimeVueColors): Promise<User> {
    return await $fetch<User>(API_URL + "/surfaceColor", {
      body: color,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
  },

  async updateUserDarkMode(sessionId: string, bool: boolean): Promise<User> {
    return await $fetch<User>(API_URL + "/darkMode", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { bool: bool },
      method: "POST"
    });
  },

  async updateUserFontSize(sessionId: string, fontSize: string): Promise<User> {
    return await $fetch<User>(API_URL + "/fontSize", {
      body: fontSize,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
  },

  async updateUserRecentActivity(sessionId: string, recentActivity: RecentActivityItemDto[]): Promise<User> {
    return await $fetch<User>(API_URL + "/recentActivity", {
      headers: { cookie: `session_id=${sessionId}` },
      body: recentActivity,
      method: "POST"
    });
  },

  async updateUserFavourites(sessionId: string, favourites: string[]): Promise<User> {
    return await $fetch<User>(API_URL + "/favourites", {
      headers: { cookie: `session_id=${sessionId}` },
      body: favourites,
      method: "POST"
    });
  },

  async updateUserOrganisations(sessionId: string, organisations: string[]): Promise<User> {
    return await $fetch<User>(API_URL + "/organisations", {
      headers: { cookie: `session_id=${sessionId}` },
      body: organisations,
      method: "POST"
    });
  },

  async updateUserNamespaces(sessionId: string, namespaces: NamespacePermissionJava[]): Promise<User> {
    return await $fetch<User>(API_URL + "/namespaces", {
      headers: { cookie: `session_id=${sessionId}` },
      body: namespaces,
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(UserService);

export default UserService;
