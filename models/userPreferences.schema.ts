import { FontSize, PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";
import { RecentActivityItemSchema } from "@endeavour/vue-library/models";

import * as z from "zod";

/**
 * The preferences a user may change about themselves, any subset at a time.
 * Strict on purpose: roles, namespaces and organisations drive authorisation and must never be settable through this.
 */
export const userPreferencesSchema = z
  .strictObject({
    theme: z.enum(PrimeVuePresetThemes),
    primaryColor: z.enum(PrimeVueColors),
    surfaceColor: z.enum(PrimeVueColors),
    darkMode: z.boolean(),
    fontSize: z.enum(FontSize),
    favourites: z.array(z.string()),
    recentActivity: z.array(RecentActivityItemSchema)
  })
  .partial()
  .refine(preferences => Object.keys(preferences).length > 0, { message: "At least one preference is required" });

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
