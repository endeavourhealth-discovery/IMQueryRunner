import type {EventHandlerRequest, H3Event} from "h3";

export default abstract class Authenticator {
  abstract getMachineToken(clientId: string, clientSecret: string): Promise<any>;

  abstract revokeToken(token: string): Promise<any>;

  abstract checkPermissions(event: H3Event<EventHandlerRequest>): Promise<void>;

  getUserId(token: string): string {
    return this.getUserInfoFromToken(token).id;
  }

  getUserName(token: string): string {
    return this.getUserInfoFromToken(token).sub;
  }

  getUserInfo(event: H3Event<EventHandlerRequest>): any {
    const header = event.headers.get("Authorization")
    if (!header) {
      throw createError({
        statusCode: 401,
        message: "401 Unauthorized",
        statusMessage: "Unauthorized",
      })
    }
    const token = header.split(" ")[1];
    return this.getUserInfoFromToken(token);
  }

  getUserInfoFromToken(token: string): any {
    return JSON.parse(atob(token.split(".")[1]));
  }
}