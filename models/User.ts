import {object, string, uuid, array, type output} from "zod/v4/mini";

export const userSchema = object({
  id: string(),
  type: string(),
  userName: string(),
  displayName: string(),
  email: string(),
  avatar: string(),
  groups: array(string()),
  roles: array(string())
});

export type User = output<typeof userSchema>;