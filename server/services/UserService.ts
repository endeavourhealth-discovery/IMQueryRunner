import { PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";
import { parseApiResponse } from "@endeavour/vue-library/helpers";
import type { NamespacePermissionJava, RecentActivityItemDto } from "@endeavour/vue-library/models";
import { User, UserSchema } from "@endeavour/vue-library/models";

const API_URL = `${useRuntimeConfig().public.imapiUrl}user/private`;

const UserService = {
  async updateUserPreset(sessionId: string, preset: PrimeVuePresetThemes): Promise<User> {
    const result = await $fetch(API_URL + "/preset", {
      headers: {
        cookie: `session_id=${sessionId}`,
        "Content-Type": "text/plain"
      },
      body: preset,
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserPrimaryColor(sessionId: string, color: PrimeVueColors): Promise<User> {
    const result = await $fetch(API_URL + "/primaryColor", {
      body: color,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserSurfaceColor(sessionId: string, color: PrimeVueColors): Promise<User> {
    const result = await $fetch(API_URL + "/surfaceColor", {
      body: color,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserDarkMode(sessionId: string, bool: boolean): Promise<User> {
    const result = await $fetch(API_URL + "/darkMode", {
      headers: { cookie: `session_id=${sessionId}` },
      body: { bool: bool },
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserFontSize(sessionId: string, fontSize: string): Promise<User> {
    const result = await $fetch(API_URL + "/fontSize", {
      body: fontSize,
      headers: {
        "Content-Type": "text/plain",
        cookie: `session_id=${sessionId}`
      },
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserRecentActivity(sessionId: string, recentActivity: RecentActivityItemDto[]): Promise<User> {
    const result = await $fetch(API_URL + "/recentActivity", {
      headers: { cookie: `session_id=${sessionId}` },
      body: recentActivity,
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserFavourites(sessionId: string, favourites: string[]): Promise<User> {
    const result = await $fetch(API_URL + "/favourites", {
      headers: { cookie: `session_id=${sessionId}` },
      body: favourites,
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserOrganisations(sessionId: string, organisations: string[]): Promise<User> {
    const result = await $fetch(API_URL + "/organisations", {
      headers: { cookie: `session_id=${sessionId}` },
      body: organisations,
      method: "POST"
    });
    return parseApiResponse(result, UserSchema);
  },

  async updateUserNamespaces(sessionId: string, namespaces: NamespacePermissionJava[]): Promise<User> {
    const result = await $fetch(API_URL + "/namespaces", {
      headers: { cookie: `session_id=${sessionId}` },
      body: namespaces,
      method: "POST"
    });
    return UserSchema.parse(result);
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(UserService);

export default UserService;
