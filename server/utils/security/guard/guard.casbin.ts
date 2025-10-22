import { type Enforcer, newEnforcer } from "casbin";
import AuthorizationError from "~~/server/errors/authorization.error";
import type Guard from "~~/server/utils/security/guard/guard.base";
import Logger from "#shared/logger";
import { BasicAdapter } from "casbin-basic-adapter";
import mysql, { type ConnectionOptions } from "mysql2";
import { AccessRequest } from "~~/models/AutoGen";
import { type User } from "~~/models/User";

export class GuardCasbin implements Guard {
  private LOG = Logger("server/utils/security/guard/casbin");
  private enforcer: Enforcer | undefined = undefined;

  async checkPermissions(
    subject: User,
    path: string,
    action: AccessRequest
  ): Promise<boolean> {
    try {
      if (!this.enforcer) await this.setupEnforcer();

      // return await this.enforcer.enforce(subject, path, action);

      // FOR DEBUG TO SEE WHICH RULE(S) PASSED
      const permission = await this.enforcer!.enforceEx(subject, path, action);
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

  async addPolicy(
    user: User,
    dataSource: string,
    accessRequest: AccessRequest
  ) {
    if (!this.enforcer) await this.setupEnforcer();
    await this.enforcer!.addPolicy(
      JSON.stringify(user),
      dataSource,
      accessRequest
    );
    await this.enforcer!.savePolicy();
  }

  async removePolicy(
    user: User,
    dataSource: string,
    accessRequest: AccessRequest
  ) {
    if (!this.enforcer) await this.setupEnforcer();
    await this.enforcer!.removePolicy(
      JSON.stringify(user),
      dataSource,
      accessRequest
    );
    await this.enforcer!.savePolicy();
  }

  async setupEnforcer(): Promise<void> {
    const access: ConnectionOptions = {
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
      password: process.env.MYSQL_PASSWORD,
    };
    const conn = mysql.createConnection(access);
    const adapter = await BasicAdapter.newAdapter("mysql", conn);
    this.enforcer ??= await newEnforcer("public/casbin/model.conf", adapter);
  }
}
