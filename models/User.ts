import { z } from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  userName: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatar: z.string(),
  type: z.string(),
  groups: z.array(z.string())
});

export type User = z.infer<typeof userSchema>;