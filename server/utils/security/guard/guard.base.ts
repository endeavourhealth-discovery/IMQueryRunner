import { User } from "#auth-utils";

export default interface Guard {
  checkPermissions(
    subject: User,
    object: string,
    action: string
  ): Promise<boolean>;
}
