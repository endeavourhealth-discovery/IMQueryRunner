import type {User} from "~~/models";
import {type Enforcer, newEnforcer} from "casbin";
import Guard from "~~/server/utils/security/guard/guard.base";
import AuthorizationError from "~~/server/errors/authorization.error";


export class GuardCasbin implements Guard {
  private enforcer: Enforcer | undefined = undefined;

  async checkPermissions(subject: User, path: string, action: string): Promise<boolean> {
    try {
      this.enforcer ??= await newEnforcer("public/casbin/model.conf", "public/casbin/policy.csv");

      // return await this.enforcer.enforce(subject, path, action);

       // FOR DEBUG TO SEE WHICH RULE(S) PASSED
      const permission = await this.enforcer.enforceEx(subject, path, action)
      console.log("========== PERMISSION ==========")
      console.log(permission[1])
      return permission[0].valueOf();
    } catch (error:any) {
      console.error('API: Error checking permissions:', error)

      throw new AuthorizationError({
        code: 401,
        message: "Unauthorized"
      })
    }
  }
}