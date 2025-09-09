import {$fetch} from "ofetch";
import {User} from "~~/models";
import Authenticator from "~~/server/security/authentication/authenticator";
import getUserFromTokenCasdoor from "#shared/jwtCasdoor";

export default class AuthenticatorCasdoor extends Authenticator {
  private casdoorUrl: string = "";
  private casdoorClientId: string = "";
  private casdoorSecret: string = "";

  initialize(token: string | null | undefined, config: any): void {
    this.setToken(token);
    this.casdoorUrl = config.public.casdoorUrl;
    this.casdoorClientId = config.public.casdoorClientId;
    this.casdoorSecret = config.public.casdoorSecret;
  }

  getUserFromToken(token: any): User {
    return getUserFromTokenCasdoor(token);
  }

  async getMachineToken(clientId: string, clientSecret: string): Promise<any> {

    try {
      return await $fetch(`${this.casdoorUrl}/api/login/oauth/access_token`, {
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
    try {
      return await $fetch(`${this.casdoorUrl}/api/delete-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + btoa(this.casdoorClientId + ":" + this.casdoorSecret)
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
}