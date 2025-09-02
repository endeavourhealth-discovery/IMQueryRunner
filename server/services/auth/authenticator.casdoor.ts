import {Authenticator} from "~~/server/services/auth/authenticator";

export class AuthenticatorCasdoor extends Authenticator {
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
}