import type { Action, Resource } from "~~/models/AutoGen";
import { type User } from "~~/models/User";

export default interface Guard {
  checkPermissions(
    subject: User | undefined,
    resource: Resource,
    action: Action
  ): Promise<boolean>;

  requirePermission(
    subject: User,
    resource: Resource,
    action: Action
  ): Promise<void>;

  addPolicy(user: User, resource: Resource, action: Action): Promise<void>;

  removePolicy(user: User, resource: Resource, action: Action): Promise<void>;
}
