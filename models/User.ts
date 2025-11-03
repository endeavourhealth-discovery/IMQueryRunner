import { z } from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  userName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  password: z.string(),
  avatar: z.string(),
  roles: z.array(z.string()),
});

export type User = z.infer<typeof userSchema>;
