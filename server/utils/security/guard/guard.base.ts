import type { AccessRequest } from "~~/models/AutoGen";
import { type User } from "~~/models/User";

export default interface Guard {
  checkPermissions(
    subject: User | undefined,
    object: string,
    action: string
  ): Promise<boolean>;

  addPolicy(
    user: User,
    dataSource: string,
    accessRequest: AccessRequest
  ): Promise<void>;

  removePolicy(
    user: User,
    dataSource: string,
    accessRequest: AccessRequest
  ): Promise<void>;
}
