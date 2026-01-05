import type {EventHandlerRequest, H3Event } from "h3";
import { setCookie, getCookie, deleteCookie } from "h3";
import type {User} from "~~/models/User";

export class EndeavourSecurity {
  private readonly ACCESS_TOKEN = "access_token";
  private readonly USER_SESSION = "user_session";
  private readonly REFRESH_TOKEN = "refresh_token";

  private readonly application: string;
  constructor(application: string) {
    this.application = application;
  }
  async getLoginUrl(redirectUri: string, state: string): Promise<string> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authn/getLoginUrl`, {
      query: {
        redirectUri: redirectUri,
        state: state
      }
    }) as any
  }
  async getTokensFromCodeInternal(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string }> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authn/getTokensFromCode`, {
      query: {
        code: code,
        redirectUri: redirectUri
      }
    }) as any
  }

  async getUserInternal(accessToken: string): Promise<User> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authn/getUser`,{
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
    }) as any
  }

  async revokeTokens(accessToken?: string, refreshToken?: string): Promise<void> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authn/revokeTokens`, {
      query: {
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    }) as any
  }

  async introspect(accessToken?: string, refreshToken?: string): Promise<void> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authn/introspect`, {
      query: {
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    }) as any
  }
  public async getTokensFromCode(event: H3Event<EventHandlerRequest>, code: string, redirectUri: string) {
    const { accessToken, refreshToken } = await this.getTokensFromCodeInternal(code, redirectUri);
    this.setCookies(event, accessToken, refreshToken)
  }

  public setCookies(event: H3Event<EventHandlerRequest>, accessToken: string, refreshToken?: string) {
    setCookie(event, this.ACCESS_TOKEN, accessToken);
    setCookie(event, this.USER_SESSION, JSON.stringify(this.getUserInternal(accessToken)));

    if (refreshToken) {
      setCookie(event, this.REFRESH_TOKEN, refreshToken);
    } else {
      deleteCookie(event, this.REFRESH_TOKEN);
    }
  }

  public async getUser(event: H3Event<EventHandlerRequest>) : Promise<User | undefined> {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    if (!accessToken)
      return undefined;

    return await this.getUserInternal(accessToken);
  }

  public async logout(event: H3Event<EventHandlerRequest>) {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);

    await this.revokeTokens(accessToken, refreshToken);

    deleteCookie(event, this.ACCESS_TOKEN);
    deleteCookie(event, this.REFRESH_TOKEN);
    deleteCookie(event, this.USER_SESSION);
  }

  public async requireUser(event: H3Event<EventHandlerRequest>) {
    const accessToken = getCookie(event, this.ACCESS_TOKEN);
    const refreshToken = getCookie(event, this.REFRESH_TOKEN);
    await this.introspect(accessToken, refreshToken);
  }

  async hasPermission(accessToken: string, object: string, action: string): Promise<boolean> {
    return await $fetch(`${process.env.AUTH_URL}/api/${this.application}/authz/hasPermission`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      query: {
        object: object,
        action: action
      }
    }) as any
  }
}