import Authenticator from "~~/server/utils/auth/authenticator.base";
import type {EventHandlerRequest, H3Event} from "h3";
import {Enforcer, newEnforcer} from 'casbin';

export default class AuthenticatorCasdoor extends Authenticator {
  private enforcer: Enforcer | undefined = undefined;

  async getMachineToken(clientId: string, clientSecret: string): Promise<any> {
    const config = useRuntimeConfig()

    try {
      return await $fetch(`${config.public.casdoorUrl}/api/login/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
      });

    } catch (error: any) {
      console.error('Error getting Casdoor token:', error)

      return {
        success: false,
        error: error.message || 'Failed to obtain Casdoor token'
      }
    }
  }

  async revokeToken(token: string): Promise<any> {
    const config = useRuntimeConfig()

    try {
      return await $fetch(`${config.public.casdoorUrl}/api/delete-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + config.public.casdoorCredentials
        },
        body: {
          "accessToken": token
        }
      })
    } catch (error: any) {
      console.error('Error revoking token:', error)

      return {
        success: false,
        error: error.message || 'Failed to revoke token'
      }
    }
  }

  async checkPermissions(event:H3Event<EventHandlerRequest>): Promise<void> {
    try {
      if (this.enforcer == undefined) {
        this.enforcer = await newEnforcer("shared/model.conf", "shared/policy.csv");
        this.enforcer.enableLog(true);
      }

      const subject = this.getUserInfo(event);
      const object = event.path;
      const action = event.method;

      console.log(subject.owner)

      const allowed = await this.enforcer.enforce(subject, object, action);
      if (!allowed) {
        throw createError({
          statusCode: 403,
          message: "403 Forbidden",
          statusMessage: "Forbidden",
        })
      }
    } catch (error:any) {
      console.error('Error checking permissions:', error)

      throw createError({
        statusCode: 401,
        message: "401 Unauthorized",
        statusMessage: "Unauthorized",
      })
    }
  }
}