import type { EventHandlerRequest, H3Event } from "h3";
import { setCookie, getCookie, deleteCookie } from "h3";
import type { User } from "~~/models/User";

export default abstract class Authenticator {
  protected readonly ACCESS_TOKEN = "access_token";
  protected readonly USER_SESSION = "user_session";
  protected readonly REFRESH_TOKEN = "refresh_token";

  abstract getLoginUrl(origin: string, redirectUrl: string): string;
  abstract getRegisterUrl(origin: string, redirectUrl: string): string;
  abstract getTokensFromCodeInternal(
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string }>;
  abstract getUserInternal(accessToken: string): User;
  abstract revokeTokens(
    event: H3Event<EventHandlerRequest>,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void>;
  abstract requireUserInternal(
    event: H3Event<EventHandlerRequest>,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void>;
  abstract loginWithBearerToken(
    event: H3Event<EventHandlerRequest>
  ): Promise<void>;
  abstract loginWithSessionId(
    event: H3Event<EventHandlerRequest>
  ): Promise<void>;

  public async getTokensFromCode(
    event: H3Event<EventHandlerRequest>,
    code: string
  ) {
    const { accessToken, refreshToken } = await this.getTokensFromCodeInternal(
      code
    );
    this.setCookies(event, accessToken, refreshToken);
  }

  public setCookies(
    event: H3Event<EventHandlerRequest>,
    accessToken: string,
    refreshToken?: string
  ) {
    setCookie(event, this.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    setCookie(
      event,
      this.USER_SESSION,
      JSON.stringify(this.getUserInternal(accessToken)),
      {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    if (refreshToken) {
      setCookie(event, this.REFRESH_TOKEN, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      deleteCookie(event, this.REFRESH_TOKEN);
    }
  }

  public getUser(event: H3Event<EventHandlerRequest>): User | undefined {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    if (!accessToken) return undefined;

    return this.getUserInternal(accessToken);
  }

  public async logout(event: H3Event<EventHandlerRequest>) {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);

    await this.revokeTokens(event, accessToken, refreshToken);

    deleteCookie(event, this.ACCESS_TOKEN);
    deleteCookie(event, this.REFRESH_TOKEN);
    deleteCookie(event, this.USER_SESSION);
  }

  public async requireUser(event: H3Event<EventHandlerRequest>) {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);
    await this.requireUserInternal(event, accessToken, refreshToken);
  }
}
