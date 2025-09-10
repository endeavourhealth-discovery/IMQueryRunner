import type {User} from "~~/models";
import Authenticator from "~~/server/utils/security/authentication/authenticator.base";

export default class AuthenticatorCognito extends Authenticator {
  getMachineToken(clientId: string, clientSecret: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  revokeToken(token: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  protected getUserFromToken(payload: any): User {
    return {} as User;
  }

  initialize(token: string | null | undefined, options?: any): void {
  }
}

