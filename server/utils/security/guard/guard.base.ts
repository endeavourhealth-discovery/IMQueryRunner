import type {User} from "~~/models/User";

export default interface Guard {
  checkPermissions(
    subject: User | undefined,
    object: string,
    action: string
  ): Promise<boolean>;
}
