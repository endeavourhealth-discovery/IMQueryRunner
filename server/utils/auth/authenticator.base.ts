import type {EventHandlerRequest, H3Event} from "h3";

export default abstract class Authenticator {
  abstract getMachineToken(clientId: string, clientSecret: string): Promise<any>;

  abstract revokeToken(token: string): Promise<any>;

  getUserId(token: string): string {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    return decodedToken.id;
  }

  getUserName(token: string): string {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    return decodedToken.sub;
  }

  checkPermissions(event: H3Event<EventHandlerRequest>): void {
    const header = event.headers.get("Authorization")
    if (!header) {
      throw createError({
        statusCode: 401,
        message: "401 Unauthorized",
        statusMessage: "Unauthorized",
      })
    }

    const token = header.split(" ")[1];

    console.log(this.getUserId(token));
    console.log(this.getUserName(token));
  }
}