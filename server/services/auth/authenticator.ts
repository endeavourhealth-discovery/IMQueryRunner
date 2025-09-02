import {AuthenticatorCasdoor} from "~~/server/services/auth/authenticator.casdoor";


export abstract class Authenticator {
  abstract getMachineToken(clientId: string, clientSecret: string): Promise<any>;
  abstract revokeToken(token: string): Promise<any>;

  getUserId(token: string): string {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    console.log(decodedToken);
    return decodedToken.sub;
  }

  getUserName(token: string): string {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    console.log(decodedToken);
    return decodedToken.sub;
  }
}

export const authenticator: Authenticator = new AuthenticatorCasdoor();