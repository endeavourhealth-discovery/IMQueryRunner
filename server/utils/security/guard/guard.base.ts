import type { User } from "casdoor-nodejs-sdk/lib/cjs/user";

export default interface Guard {
  checkPermissions(
    subject: User,
    object: string,
    action: string
  ): Promise<boolean>;
}
