import { PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";
import type { NamespacePermissionJava, RecentActivityItemDto } from "@endeavour/vue-library/interfaces";
import { type User } from "@endeavour/vue-library/models";

const API_URL = "api/imapi/user";

const UserService = {
  async updateUserPreset(preset: PrimeVuePresetThemes): Promise<User> {
    return await $fetch<User>(API_URL + "/preset", {
      body: preset,
      headers: { "Content-Type": "text/plain" },
      method: "POST"
    });
  },
  async updateUserPrimaryColor(color: PrimeVueColors): Promise<User> {
    return await $fetch<User>(API_URL + "/primaryColor", {
      body: color,
      headers: { "Content-Type": "text/plain" },
      method: "POST"
    });
  },
  async updateUserSurfaceColor(color: PrimeVueColors): Promise<User> {
    return await $fetch<User>(API_URL + "/surfaceColor", {
      body: color,
      headers: { "Content-Type": "text/plain" },
      method: "POST"
    });
  },
  async updateUserDarkMode(bool: boolean): Promise<User> {
    return await $fetch<User>(API_URL + "/darkMode", {
      body: { bool: bool },
      method: "POST"
    });
  },
  async updateUserFontSize(fontSize: string): Promise<User> {
    return await $fetch<User>(API_URL + "/fontSize", {
      body: fontSize,
      headers: { "Content-Type": "text/plain" },
      method: "POST"
    });
  },
  async updateUserRecentActivity(recentActivity: RecentActivityItemDto[]): Promise<User> {
    return await $fetch<User>(API_URL + "/recentActivity", {
      body: recentActivity,
      method: "POST"
    });
  },
  async updateUserFavourites(favourites: string[]): Promise<User> {
    return await $fetch<User>(API_URL + "/favourites", {
      body: favourites,
      method: "POST"
    });
  },
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
