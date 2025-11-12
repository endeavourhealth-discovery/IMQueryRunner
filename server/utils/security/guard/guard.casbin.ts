import { type Enforcer, newEnforcer } from "casbin";
import AuthorizationError from "~~/server/errors/authorization.error";
import type Guard from "~~/server/utils/security/guard/guard.base";
import Logger from "#shared/logger";
import { BasicAdapter } from "casbin-basic-adapter";
import mysql, { type ConnectionOptions } from "mysql2";
import { Action, Resource } from "~~/models/AutoGen";
import { type User } from "~~/models/User";

export class GuardCasbin implements Guard {
  private LOG = Logger("server/utils/security/guard/casbin");
  private enforcer: Enforcer | undefined = undefined;

  async checkPermissions(
    subject: User,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    try {
      if (!this.enforcer) await this.setupEnforcer();

      // return await this.enforcer.enforce(subject, path, action);

      // FOR DEBUG TO SEE WHICH RULE(S) PASSED
      const permission = await this.enforcer!.enforceEx(
        subject,
        resource,
        action
      );
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

  async requirePermission(
    subject: User,
    resource: Resource,
    action: Action
  ): Promise<void> {
    const hasPermission = this.checkPermissions(subject, resource, action);
    if (!hasPermission)
      throw new AuthorizationError({ code: 401, message: "Unauthorized" });
  }

  async addPolicy(user: User, resource: Resource, action: Action) {
    if (!this.enforcer) await this.setupEnforcer();
    await this.enforcer!.addPolicy(JSON.stringify(user), resource, action);
    await this.enforcer!.savePolicy();
  }

  async removePolicy(user: User, resource: Resource, action: Action) {
    if (!this.enforcer) await this.setupEnforcer();
    await this.enforcer!.removePolicy(JSON.stringify(user), resource, action);
    await this.enforcer!.savePolicy();
  }

  async setupEnforcer(): Promise<void> {
    const conn = mysql.createConnection(process.env.CASBIN_URL as string);
    const adapter = await BasicAdapter.newAdapter(
      "mysql",
      conn,
      "casbin_query_runner"
    );
    this.enforcer ??= await newEnforcer("public/casbin/model.conf", adapter);
    this.enforcer.addFunction("include", (roleNames, subRole) => {
      if (!Array.isArray(roleNames)) return false;
      return roleNames.includes(subRole);
    });
  }
}
