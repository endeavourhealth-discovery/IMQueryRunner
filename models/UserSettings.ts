import { z } from "zod";
import { PrimeVueColors, PrimeVuePresetThemes } from "~~/enums";

export const userSettingsSchema = z.object({
  currentPreset: z.enum(PrimeVuePresetThemes),
  currentPrimaryColor: z.enum(PrimeVueColors),
  currentSurfaceColor: z.enum(PrimeVueColors),
  darkMode: z.boolean(),
  currentScale: z.string(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
