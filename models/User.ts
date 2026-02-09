import {object, string, uuid, array, type output} from "zod/v4/mini";

export const userSchema = object({
  id: uuid(),
  userName: string(),
  displayName: string(),
  email: string(),
  avatar: string(),
  type: string(),
  groups: array(string()),
  roles: array(string())
});

export type User = output<typeof userSchema>;