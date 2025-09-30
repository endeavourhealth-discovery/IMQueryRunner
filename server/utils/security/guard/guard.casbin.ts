import { type Enforcer, newEnforcer } from "casbin";
import AuthorizationError from "~~/server/errors/authorization.error";
import type Guard from "~~/server/utils/security/guard/guard.base";
import type {User} from "~~/models/User";
import Logger from "#shared/logger";

export class GuardCasbin implements Guard {
  private LOG = Logger("server/utils/security/guard/casbin");
  private enforcer: Enforcer | undefined = undefined;

  async checkPermissions(
    subject: User,
    path: string,
    action: string
  ): Promise<boolean> {
    try {
      this.enforcer ??= await newEnforcer(
        "public/casbin/model.conf",
        "public/casbin/policy.csv"
      );

      // return await this.enforcer.enforce(subject, path, action);

      // FOR DEBUG TO SEE WHICH RULE(S) PASSED
      const permission = await this.enforcer.enforceEx(subject, path, action);
      this.LOG.debug("========== PERMISSION ==========");
      this.LOG.debug(`[${permission[1]}]`);
      return permission[0].valueOf();
    } catch (error: any) {
      this.LOG.error("API: Error checking permissions:");
      this.LOG.error(error);
      console.error(error);

      throw new AuthorizationError({
        code: 401,
        message: "Unauthorized",
      });
    }
  }
}
