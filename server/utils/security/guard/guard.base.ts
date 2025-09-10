import {User} from "~~/models";

export default interface Guard {
  checkPermissions(subject: User, object: string, action: string): Promise<boolean>;
}
