import {User} from "~~/models";

export default abstract class Authenticator {
  private user: User = {} as User;

  abstract initialize(token: string | null | undefined, options?: any): void;
  abstract getMachineToken(clientId: string, clientSecret: string): Promise<any>;
  abstract revokeToken(token: string): Promise<any>;

  protected setToken(token: any): void {
    if (token) {
      this.user = this.getUserFromToken(token);
    } else {
      this.user = {} as User;
    }
  }

  getUser(): User {
    return this.user;
  }

  protected abstract getUserFromToken(payload: any): User;

  isLoggedIn(): boolean {
    return this.user.id !== undefined && this.user.id !== "";
  }
}
