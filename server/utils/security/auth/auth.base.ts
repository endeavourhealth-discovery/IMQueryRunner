import type {User} from "casdoor-nodejs-sdk/lib/cjs/user";
import type {EventHandlerRequest, H3Event } from "h3";
import { setCookie, getCookie, deleteCookie } from "h3";

export default abstract class Authenticator {
  protected readonly ACCESS_TOKEN = "access_token";
  protected readonly USER_SESSION = "user_session";
  protected readonly REFRESH_TOKEN = "refresh_token";
  abstract getTokensFromCodeInternal(code: string): Promise<{ accessToken: string, refreshToken?: string}>;
  abstract getUserInternal(accessToken: string): User;
  abstract revokeTokens(event: H3Event<EventHandlerRequest>, accessToken?: string, refreshToken?: string): Promise<void>;
  abstract requireUserInternal(event: H3Event<EventHandlerRequest>, accessToken?: string, refreshToken?: string): Promise<void>;

  public async getTokensFromCode(event: H3Event<EventHandlerRequest>,code: string) {
    const { accessToken, refreshToken } = await this.getTokensFromCodeInternal(code);
    this.setCookies(event, accessToken, refreshToken)
  }

  public setCookies(event: H3Event<EventHandlerRequest>, accessToken: string, refreshToken?: string) {
    setCookie(event, this.ACCESS_TOKEN, accessToken);
    console.log("API : Access token set")

    setCookie(event, this.USER_SESSION, JSON.stringify(this.getUserInternal(accessToken)));
    console.log("API : Session token set")

    if (refreshToken) {
      setCookie(event, this.REFRESH_TOKEN, refreshToken);
      console.log("API : Refresh token set")
    } else {
      deleteCookie(event, this.REFRESH_TOKEN);
      console.log("API : No refresh token")
    }
  }

  public getUser(event: H3Event<EventHandlerRequest>) : User | undefined {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    if (!accessToken)
      return undefined;

    return this.getUserInternal(accessToken);
  }

  public async logout(event: H3Event<EventHandlerRequest>) {
    console.log("API : Logging out")
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);

    console.log("API : Revoking provider tokens")
    await this.revokeTokens(event, accessToken, refreshToken);

    console.log("API : Revoking application tokens")
    deleteCookie(event, this.ACCESS_TOKEN);
    deleteCookie(event, this.REFRESH_TOKEN);
    deleteCookie(event, this.USER_SESSION);

    console.log("API : Logged out")
  }

  public async requireUser(event: H3Event<EventHandlerRequest>) {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);
    await this.requireUserInternal(event, accessToken, refreshToken);
  }
}