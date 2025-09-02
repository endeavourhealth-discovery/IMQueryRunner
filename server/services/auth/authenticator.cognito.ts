import {Authenticator} from "~~/server/services/auth/authenticator";
import {CognitoIdentityProvider} from "@aws-sdk/client-cognito-identity-provider";

export class AuthenticatorCognito implements Authenticator {
  private cognito = new CognitoIdentityProvider();

  async getMachineToken(clientId: string, clientSecret: string): Promise<any> {
    const config = useRuntimeConfig()

    try {
      const response = await this.cognito.adminInitiateAuth({
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        UserPoolId: config.public.cognitoUserPool,
        ClientId: config.public.cognitoWebClient,
        AuthParameters: {
          USERNAME: clientId,
          PASSWORD: clientSecret
        }
      })


      return await $fetch(`${config.public.CognitoUrl}/api/login/oauth/access_token`, {
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
      console.error('Error getting Cognito token:', error)

      return {
        success: false,
        error: error.message || 'Failed to obtain Cognito token'
      }
    }
  }

  async revokeToken(token: string): Promise<any> {
    const config = useRuntimeConfig()

    try {
      return await $fetch(`${config.public.cognitoUrl}/api/delete-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + config.public.cognitoCredentials
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